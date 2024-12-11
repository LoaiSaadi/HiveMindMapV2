import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, { addEdge } from "reactflow";
import "reactflow/dist/style.css";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const MapEditor = ({ mapId }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [mapName, setMapName] = useState("");

  useEffect(() => {
    const docRef = doc(db, "maps", mapId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setMapName(data.name || "Untitled Map");
      }
    });
    return () => unsubscribe();
  }, [mapId]);

  const updateMap = async (newNodes, newEdges) => {
    const docRef = doc(db, "maps", mapId);
    await updateDoc(docRef, {
      nodes: newNodes,
      edges: newEdges
    });
  };

  const onNodesChange = useCallback((changes) => {
    const updated = nodes.map((node) => {
      const change = changes.find((c) => c.id === node.id);
      return change ? { ...node, ...change } : node;
    });
    setNodes(updated);
    updateMap(updated, edges);
  }, [nodes, edges]);

  const onEdgesChange = useCallback((changes) => {
    const updated = edges.map((edge) => {
      const change = changes.find((c) => c.id === edge.id);
      return change ? { ...edge, ...change } : edge;
    });
    setEdges(updated);
    updateMap(nodes, updated);
  }, [nodes, edges]);

  const onConnect = useCallback((params) => {
    const newEdges = addEdge(params, edges);
    setEdges(newEdges);
    updateMap(nodes, newEdges);
  }, [nodes, edges]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h2 style={{ position: 'absolute', top: 0, left: 20, background: '#fff', padding: '10px', zIndex: 10 }}>
        {mapName}
      </h2>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
};

export default MapEditor;
