import React from 'react'

export function Button({buttonText, onClick}) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      padding: '14px',
      backgroundColor: '#3d1a7a',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
    }}>{buttonText}</button>
  )
}