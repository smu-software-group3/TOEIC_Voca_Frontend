import React from 'react'

export default function Input({placeholder, value, onChange, type}) {
  return (
    <input
      type={type || 'text'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: '1.5px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '15px',
        color: '#1f2937',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  )
}