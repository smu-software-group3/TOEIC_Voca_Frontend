import React from 'react'

export function Form({onSubmit, children}) {
  return (
    <form onSubmit={onSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '400px',
      padding: '40px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
    }}>
      {children}
    </form>
  )
}