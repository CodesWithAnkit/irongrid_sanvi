"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { z } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationState<T> {
  data: T;
  errors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialData: T;
  onSubmit?: (data: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  onAutoSave?: (data: T) => Promise<void> | void;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialData,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  autoSave = false,
  autoSaveDelay = 2000,
  onAutoSave,
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<FormValidationState<T>>({
    data: initialData,
    errors: {},
    touchedFields: {},
    isValid: false,
    isDirty: false,
    isSubmitting: false,
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const initialDataRef = useRef(initialData);

  // Update initial data reference when it changes
  useEffect(() => {
    initialDataRef.current = initialData;
    setState(prev => ({
      ...prev,
      data: initialData,
      isDirty: false,
      errors: {},
      touchedFields: {},
    }));
  }, [initialData]);

  // Validate a single field
  const validateField = useCallback((field: string, value: any): string | undefined => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.shape[field as keyof typeof schema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message;
      }
      return "Invalid value";
    }
  }, [schema]);

  // Validate entire form
  const validateForm = useCallback((data: T): Record<string, string> => {
    try {
      schema.parse(data);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          if (!errors[field]) {
            errors[field] = err.message;
          }
        });
        return errors;
      }
      return { form: "Validation failed" };
    }
  }, [schema]);

  // Set field value
  const setFieldValue = useCallback((field: string, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      const isDirty = JSON.stringify(newData) !== JSON.stringify(initialDataRef.current);
      
      let newErrors = { ...prev.errors };
      
      if (validateOnChange) {
        const fieldError = validateField(field, value);
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
      }

      const isValid = Object.keys(newErrors).length === 0 && isDirty;

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isDirty,
        isValid,
      };
    });

    // Handle auto-save
    if (autoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        setState(current => {
          if (current.isDirty && Object.keys(current.errors).length === 0) {
            onAutoSave(current.data);
          }
          return current;
        });
      }, autoSaveDelay);
    }
  }, [validateOnChange, validateField, autoSave, onAutoSave, autoSaveDelay]);

  // Set field touched
  const setFieldTouched = useCallback((field: string, touched = true) => {
    setState(prev => {
      const newTouchedFields = { ...prev.touchedFields, [field]: touched };
      let newErrors = { ...prev.errors };

      if (validateOnBlur && touched) {
        const fieldError = validateField(field, prev.data[field]);
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
      }

      const isValid = Object.keys(newErrors).length === 0 && prev.isDirty;

      return {
        ...prev,
        touchedFields: newTouchedFields,
        errors: newErrors,
        isValid,
      };
    });
  }, [validateOnBlur, validateField]);

  // Set multiple field values
  const setFieldValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newData = { ...prev.data, ...values };
      const isDirty = JSON.stringify(newData) !== JSON.stringify(initialDataRef.current);
      
      let newErrors = { ...prev.errors };
      
      if (validateOnChange) {
        Object.entries(values).forEach(([field, value]) => {
          const fieldError = validateField(field, value);
          if (fieldError) {
            newErrors[field] = fieldError;
          } else {
            delete newErrors[field];
          }
        });
      }

      const isValid = Object.keys(newErrors).length === 0 && isDirty;

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isDirty,
        isValid,
      };
    });
  }, [validateOnChange, validateField]);

  // Set errors manually
  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors },
      isValid: Object.keys({ ...prev.errors, ...errors }).length === 0 && prev.isDirty,
    }));
  }, []);

  // Clear errors
  const clearErrors = useCallback((fields?: string[]) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      
      if (fields) {
        fields.forEach(field => delete newErrors[field]);
      } else {
        Object.keys(newErrors).forEach(field => delete newErrors[field]);
      }

      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0 && prev.isDirty,
      };
    });
  }, []);

  // Reset form
  const reset = useCallback((newData?: T) => {
    const resetData = newData || initialDataRef.current;
    setState({
      data: resetData,
      errors: {},
      touchedFields: {},
      isValid: false,
      isDirty: false,
      isSubmitting: false,
    });
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);

  // Submit form
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const formErrors = validateForm(state.data);
      
      if (Object.keys(formErrors).length > 0) {
        setState(prev => ({
          ...prev,
          errors: formErrors,
          isSubmitting: false,
          isValid: false,
        }));
        return false;
      }

      if (onSubmit) {
        await onSubmit(state.data);
      }
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isDirty: false,
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { form: error instanceof Error ? error.message : "Submission failed" },
      }));
      return false;
    }
  }, [state.data, validateForm, onSubmit]);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((field: string) => ({
    value: state.data[field],
    error: state.touchedFields[field] ? state.errors[field] : undefined,
    onChange: (value: any) => setFieldValue(field, value),
    onBlur: () => setFieldTouched(field, true),
    required: schema.shape[field as keyof typeof schema.shape]?.isOptional?.() === false,
  }), [state.data, state.errors, state.touchedFields, setFieldValue, setFieldTouched, schema]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    data: state.data,
    errors: state.errors,
    touchedFields: state.touchedFields,
    isValid: state.isValid,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,
    
    // Actions
    setFieldValue,
    setFieldTouched,
    setFieldValues,
    setErrors,
    clearErrors,
    reset,
    handleSubmit,
    getFieldProps,
    
    // Validation
    validateField,
    validateForm,
  };
}