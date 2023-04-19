import React from 'react';

const EditableText = () => {
  return (
    <div
      className='outline-none'
      contentEditable={true}
      suppressContentEditableWarning={true}
    >
      Let your thoughts flow 🌊
    </div>
  );
};

export default EditableText;
