import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  addEdge,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // להתאים לכתובת השרת שלך

const initialNodes = [
  { id: "1", data: { label: "Node 1" }, position: { x: 250, y: 5 } },
];
const initialEdges = [];

const MapEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");
  const [selectedNodes, setSelectedNodes] = useState([]);

  useEffect(() => {
    socket.on("mapUpdate", (mapData) => {
      setMapName(mapData.name || "");
      setMapDescription(mapData.description || "");
      setNodes(mapData.nodes || initialNodes);
      setEdges(mapData.edges || initialEdges);
    });

    return () => {
      socket.off("mapUpdate");
    };
  }, [setNodes, setEdges]);

  const sendMapStateToServer = useCallback(
    (newNodes = nodes, newEdges = edges, newName = mapName, newDescription = mapDescription) => {
      socket.emit("mapChange", {
        name: newName,
        description: newDescription,
        nodes: newNodes,
        edges: newEdges,
      });
    },
    [mapName, mapDescription, nodes, edges]
  );

  const addNode = useCallback(() => {
    const newId = (nodes.length + 1).toString();
    const newNode = {
      id: newId,
      data: { label: `Node ${newId}` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    sendMapStateToServer(updatedNodes, edges, mapName, mapDescription);
  }, [nodes, edges, mapName, mapDescription, sendMapStateToServer]);

  const addEdgeHandler = useCallback(() => {
    if (selectedNodes.length === 2) {
      const newEdge = {
        id: `e${selectedNodes[0].id}-${selectedNodes[1].id}`,
        source: selectedNodes[0].id,
        target: selectedNodes[1].id,
        markerEnd: { type: "arrow" },
      };
      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      setSelectedNodes([]);
      sendMapStateToServer(nodes, updatedEdges, mapName, mapDescription);
    } else {
      alert("Please select two nodes to connect.");
    }
  }, [selectedNodes, nodes, edges, mapName, mapDescription, sendMapStateToServer]);

  const saveMap = () => {
    if (!mapName.trim()) return alert("Map name is required.");
    alert("Map saved successfully!");
    sendMapStateToServer(nodes, edges, mapName, mapDescription);
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodes((prev) => {
      if (prev.length === 2) return [node]; 
      if (prev.find((n) => n.id === node.id)) return prev; 
      return [...prev, node];
    });
  }, []);

  // שינוי שם צומת בלחיצה כפולה
  const onNodeDoubleClick = useCallback((event, node) => {
    const newName = prompt("Enter new node name:", node.data.label);
    if (newName && newName.trim()) {
      const updatedNodes = nodes.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, label: newName } } : n
      );
      setNodes(updatedNodes);
      sendMapStateToServer(updatedNodes, edges, mapName, mapDescription);
    }
  }, [nodes, edges, mapName, mapDescription, sendMapStateToServer, setNodes]);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex" }}>
      {/* React Flow Canvas */}
      <div style={{ width: "80%", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
        />
      </div>

      {/* Control Panel */}
      <div style={{ width: "20%", padding: "10px", background: "#f4f4f4" }}>
        <h3>Map Details</h3>
        
        <button onClick={addNode} style={{ marginBottom: "10px" }}>
          Add Node
        </button>
        <button onClick={addEdgeHandler}>Add Edge</button>

        <div style={{ marginTop: "20px" }}>
          <h4>Selected Nodes</h4>
          {selectedNodes.map((node) => (
            <div key={node.id}>Node {node.id}: {node.data.label}</div>
          ))}
          {selectedNodes.length === 0 && <div>No nodes selected</div>}
        </div>

        <div>
          <div>
            <label>Map Name:</label>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Enter map name"
              style={{ width: "100%", marginBottom: "10px" }}
            />
          </div>
          <div>
            <label>Map Description:</label>
            <textarea
              value={mapDescription}
              onChange={(e) => setMapDescription(e.target.value)}
              placeholder="Enter map description"
              style={{ width: "100%", height: "100px" }}
            />
          </div>
          <button onClick={saveMap} style={{ marginTop: "20px" }}>
            Save Map
          </button>
        </div>
      </div>
    </div>
  );
};

const MapEditorWithParams = () => (
  <ReactFlowProvider>
    <MapEditor />-
  </ReactFlowProvider>
);

export default MapEditorWithParams;
