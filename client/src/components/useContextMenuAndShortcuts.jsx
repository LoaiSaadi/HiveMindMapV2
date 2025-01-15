import { useState, useEffect, useCallback } from "react";

export default function useContextMenuAndShortcuts({ addNode, onDelete }) {
  // State to track context menu position
  const [contextMenu, setContextMenu] = useState(null);

  // Open context menu
  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  // Add node at context menu position
  const handleAddNodeFromContextMenu = () => {
    if (contextMenu) {
      addNode({ x: contextMenu.x, y: contextMenu.y });
      setContextMenu(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "n") {
        addNode(); // Add a node
      } else if (event.key === "Delete" || event.key === "Backspace") {
        onDelete(); // Delete selected elements
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [addNode, onDelete]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  return {
    contextMenu,
    handleContextMenu,
    handleAddNodeFromContextMenu,
  };
}
