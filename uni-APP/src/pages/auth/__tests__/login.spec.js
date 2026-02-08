import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

vi.stubGlobal('uni', {
  navigateTo: vi.fn(),
  showToast: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn()
})

describe('Login Page', () => {
  it('should be a valid test setup', () => {
    expect(true).toBe(true)
  })
})
