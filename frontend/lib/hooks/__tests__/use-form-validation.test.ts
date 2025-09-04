import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from '../use-form-validation';

const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

type TestFormData = z.infer<typeof testSchema>;

const initialData: TestFormData = {
  name: '',
  email: '',
  age: 0,
};

describe('useFormValidation', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
      })
    );

    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.touchedFields).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates field value correctly', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
        validateOnChange: true,
      })
    );

    act(() => {
      result.current.setFieldValue('name', 'John');
    });

    expect(result.current.data.name).toBe('John');
    expect(result.current.isDirty).toBe(true);
  });

  it('validates field on change when validateOnChange is true', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
        validateOnChange: true,
      })
    );

    act(() => {
      result.current.setFieldValue('name', 'J'); // Too short
    });

    expect(result.current.errors.name).toBe('Name must be at least 2 characters');
  });

  it('validates field on blur when validateOnBlur is true', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
        validateOnBlur: true,
      })
    );

    act(() => {
      result.current.setFieldValue('email', 'invalid-email');
      result.current.setFieldTouched('email', true);
    });

    expect(result.current.errors.email).toBe('Invalid email address');
  });

  it('clears field error when valid value is entered', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
        validateOnChange: true,
      })
    );

    act(() => {
      result.current.setFieldValue('name', 'J'); // Invalid
    });

    expect(result.current.errors.name).toBeDefined();

    act(() => {
      result.current.setFieldValue('name', 'John'); // Valid
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it('sets multiple field values correctly', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
      })
    );

    act(() => {
      result.current.setFieldValues({
        name: 'John',
        email: 'john@example.com',
      });
    });

    expect(result.current.data.name).toBe('John');
    expect(result.current.data.email).toBe('john@example.com');
    expect(result.current.isDirty).toBe(true);
  });

  it('sets and clears errors manually', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
      })
    );

    act(() => {
      result.current.setErrors({ name: 'Custom error' });
    });

    expect(result.current.errors.name).toBe('Custom error');

    act(() => {
      result.current.clearErrors(['name']);
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it('resets form to initial state', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
      })
    );

    act(() => {
      result.current.setFieldValue('name', 'John');
      result.current.setErrors({ email: 'Error' });
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.errors.email).toBeDefined();

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toEqual(initialData);
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('handles form submission successfully', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const validData: TestFormData = {
      name: 'John',
      email: 'john@example.com',
      age: 25,
    };

    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData: validData,
        onSubmit,
      })
    );

    let submitResult: boolean | undefined;

    await act(async () => {
      submitResult = await result.current.handleSubmit();
    });

    expect(submitResult).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith(validData);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('handles form submission with validation errors', async () => {
    const onSubmit = vi.fn();
    const invalidData: TestFormData = {
      name: 'J', // Too short
      email: 'invalid-email',
      age: 16, // Too young
    };

    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData: invalidData,
        onSubmit,
      })
    );

    let submitResult: boolean | undefined;

    await act(async () => {
      submitResult = await result.current.handleSubmit();
    });

    expect(submitResult).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('handles submission error', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
    const validData: TestFormData = {
      name: 'John',
      email: 'john@example.com',
      age: 25,
    };

    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData: validData,
        onSubmit,
      })
    );

    let submitResult: boolean | undefined;

    await act(async () => {
      submitResult = await result.current.handleSubmit();
    });

    expect(submitResult).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errors.form).toBe('Submission failed');
  });

  it('provides correct field props', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
      })
    );

    const fieldProps = result.current.getFieldProps('name');

    expect(fieldProps.value).toBe('');
    expect(fieldProps.error).toBeUndefined();
    expect(typeof fieldProps.onChange).toBe('function');
    expect(typeof fieldProps.onBlur).toBe('function');
  });

  it('handles auto-save functionality', async () => {
    const onAutoSave = vi.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() =>
      useFormValidation({
        schema: testSchema,
        initialData,
        autoSave: true,
        autoSaveDelay: 100,
        onAutoSave,
      })
    );

    act(() => {
      result.current.setFieldValue('name', 'John');
    });

    // Wait for auto-save delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(onAutoSave).toHaveBeenCalled();
  });
});