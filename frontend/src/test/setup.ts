// setupTests.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

globalThis.jest = vi as unknown as typeof jest
