// CustomNode.jsx
import React, { useState, useRef } from 'react';

const CustomNode = ({ data, id }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef(null);

  const handleDoubleClick = () => {
    setEditing(true);
    // נשתמש ב-setTimeout כדי להבטיח ש-React יסיים רינדור לפני focus
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleBlur = () => {
    setEditing(false);
    // כאן ניתן לקרוא לפונקציה שמעדכנת את ה-node למעלה
    data.onChangeNodeLabel(id, label);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current.blur();
    }
  };

  return (
    <div
      style={{
        padding: '8px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        minWidth: '100px',
        textAlign: 'center'
      }}
      onDoubleClick={handleDoubleClick}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ width: '90%' }}
        />
      ) : (
        <div>{label}</div>
      )}
    </div>
  );
};

export default CustomNode;
