// import React, { useState, useCallback, useEffect } from "react";
// import ReactFlow, {
//   addEdge,
//   ReactFlowProvider,
//   useEdgesState,
//   useNodesState,
// } from "reactflow";
// import "reactflow/dist/style.css";
// import { doc, updateDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
// import { db } from "../firebase"; // Your Firebase db

// const initialNodes = [
//   { id: "1", data: { label: "Node 1" }, position: { x: 250, y: 5 } },
// ];

// const initialEdges = [];

// const MapEditor = ({ mapId }) => {
//   const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
//   const [nodeId, setNodeId] = useState(2); // To generate unique IDs for new nodes
//   const [selectedNodes, setSelectedNodes] = useState([]); // Store selected nodes for edge creation
//   const [mapName, setMapName] = useState(""); // State for map name
//   const [mapDescription, setMapDescription] = useState(""); // State for map description

//   // Load existing map data when the component mounts
//   useEffect(() => {
//     const loadMapData = async () => {
//       if (mapId) {
//         const mapRef = doc(db, "maps", mapId);
//         const mapSnapshot = await getDoc(mapRef);
//         if (mapSnapshot.exists()) {
//           const mapData = mapSnapshot.data();
//           setMapName(mapData.name);
//           setMapDescription(mapData.description || "");
//           setNodes(mapData.nodes || initialNodes);
//           setEdges(mapData.edges || initialEdges);
//         }
//       }
//     };

//     loadMapData();
//   }, [mapId]);

//   // Function to add a new node
//   const addNode = useCallback(() => {
//     const newNode = {
//       id: nodeId.toString(),
//       data: { label: `Node ${nodeId}` },
//       position: { x: Math.random() * 400, y: Math.random() * 400 },
//     };
//     setNodes((nds) => [...nds, newNode]);
//     setNodeId((id) => id + 1);
//   }, [nodeId, setNodes]);

//   // Function to handle node click for selecting nodes to connect
//   const onNodeClick = useCallback(
//     (event, node) => {
//       setSelectedNodes((prev) => {
//         if (prev.length === 2) return [node]; // Reset selection if two nodes are already selected
//         if (prev.find((n) => n.id === node.id)) return prev; // Avoid duplicates
//         return [...prev, node];
//       });
//     },
//     [setSelectedNodes]
//   );

//   // Function to add a new edge between selected nodes
//   const addEdgeHandler = useCallback(() => {
//     if (selectedNodes.length === 2) {
//       const newEdge = {
//         id: `e${selectedNodes[0].id}-${selectedNodes[1].id}`,
//         source: selectedNodes[0].id,
//         target: selectedNodes[1].id,
//         markerEnd: { type: "arrow" }, // Add arrow marker to edge
//       };
//       setEdges((eds) => addEdge(newEdge, eds));
//       setSelectedNodes([]); // Reset selection after adding the edge
//     } else {
//       alert("Please select two nodes to connect.");
//     }
//   }, [selectedNodes, setEdges]);

//   // Save map data to Firebase
//   const saveMap = async () => {
//     if (!mapName.trim()) return alert("Map name is required.");
//     const mapRef = doc(db, "maps", mapId);
//     await updateDoc(mapRef, {
//       name: mapName,
//       description: mapDescription,
//       nodes,
//       edges,
//     });
//     alert("Map saved successfully!");
//   };

//   return (
//     <div style={{ width: "100%", height: "100vh", display: "flex" }}>
//       {/* React Flow Canvas */}
//       <div style={{ width: "80%", height: "100%" }}>
//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onNodeClick={onNodeClick} // Handle node click for selection
//           fitView
//         />
//       </div>

//       {/* Control Panel */}
//       <div style={{ width: "20%", padding: "10px", background: "#f4f4f4" }}>
//         <h3>Map Details</h3>
//         <button onClick={addNode} style={{ marginBottom: "10px" }}>
//           Add Node
//         </button>
//         <button onClick={addEdgeHandler}>Add Edge</button>

//         <div style={{ marginTop: "20px" }}>
//           <h4>Selected Nodes</h4>
//           {selectedNodes.map((node) => (
//             <div key={node.id}>Node {node.id}</div>
//           ))}
//         </div>

//         {/* Map Info Section */}
//         <div>
          
//           <div>
//             <label>Map Name:</label>
//             <input
//               type="text"
//               value={mapName}
//               onChange={(e) => setMapName(e.target.value)}
//               placeholder="Enter map name"
//               style={{ width: "100%", marginBottom: "10px" }}
//             />
//           </div>
//           <div>
//             <label>Map Description:</label>
//             <textarea
//               value={mapDescription}
//               onChange={(e) => setMapDescription(e.target.value)}
//               placeholder="Enter map description"
//               style={{ width: "100%", height: "100px" }}
//             />
//           </div>
//           <button onClick={saveMap} style={{ marginTop: "20px" }}>
//             Save Map
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // React Flow Provider Wrapper
// const MapEditorWithParams = ({ mapId }) => (
//   <ReactFlowProvider>
//     <MapEditor mapId={mapId} />
//   </ReactFlowProvider>
// );


// export default MapEditorWithParams;
// Import necessary modules
import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const initialNodes = [
  {
    id: "1",
    data: { label: "Node 1" },
    position: { x: 250, y: 5 },
  },
];

const initialEdges = [];

const MapEditor = ({ mapId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(2); // Track next node ID
  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");
  const [selectedElements, setSelectedElements] = useState([]); // Track selected elements

  const navigate = useNavigate();

  // Update Firebase in real-time
  const updateFirebase = useCallback((newNodes, newEdges) => {
    const mapRef = doc(db, "maps", mapId);
    updateDoc(mapRef, {
      nodes: newNodes,
      edges: newEdges,
      name: mapName,
      description: mapDescription,
    });
  }, [mapId, mapName, mapDescription]);

  // Handle connection
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const updatedEdges = addEdge(params, eds);
        updateFirebase(nodes, updatedEdges);
        return updatedEdges;
      });
      socket.emit("edge-added", params); // Emit the edge to other clients
    },
    [nodes, updateFirebase]
  );

  // Handle node changes (removal or updates)
  const handleNodeChanges = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        updateFirebase(updatedNodes, edges);
        return updatedNodes;
      });
    },
    [edges, updateFirebase]
  );

  // Handle edge changes (removal or updates)
  const handleEdgeChanges = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        updateFirebase(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes, updateFirebase]
  );

  // Add new node
  const addNode = useCallback(() => {
    const newNode = {
      id: nodeId.toString(),
      data: { label: `Node ${nodeId}` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => {
      const updatedNodes = [...nds, newNode];
      updateFirebase(updatedNodes, edges);
      return updatedNodes;
    });
    setNodeId((id) => id + 1); // Increment nodeId
    socket.emit("node-added", newNode); // Emit new node to server
  }, [nodeId, edges, updateFirebase]);

  // Handle double click to rename node with inline input
  const onNodeDoubleClick = useCallback(
    (event, node) => {
      const newLabel = window.prompt("Enter new label for the node:", node.data.label);
      if (newLabel !== null) {
        setNodes((nds) => {
          const updatedNodes = nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
          );
          updateFirebase(updatedNodes, edges);
          return updatedNodes;
        });
        socket.emit("node-renamed", { id: node.id, label: newLabel }); // Emit renamed node to server
      }
    },
    [edges, updateFirebase]
  );

  // Handle element deletion
  const onDelete = useCallback(() => {
    const remainingNodes = nodes.filter((node) => !selectedElements.includes(node.id));
    const remainingEdges = edges.filter((edge) => !selectedElements.includes(edge.id));
    setNodes(remainingNodes);
    setEdges(remainingEdges);
    setSelectedElements([]); // Clear selection
    updateFirebase(remainingNodes, remainingEdges); // Save updated map
    socket.emit("elements-deleted", selectedElements); // Emit deleted elements to server
  }, [nodes, edges, selectedElements, updateFirebase]);

  // Load map data in real-time
  useEffect(() => {
    const mapRef = doc(db, "maps", mapId);

    const unsubscribe = onSnapshot(mapRef, (doc) => {
      if (doc.exists()) {
        const mapData = doc.data();
        setNodes(mapData.nodes || []);
        setEdges(mapData.edges || []);
        setMapName(mapData.name || "");
        setMapDescription(mapData.description || "");
      }
    });

    return () => unsubscribe();
  }, [mapId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        onDelete();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDelete]);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex" }}>
      <div style={{ width: "80%", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodeChanges} // Handle node changes
          onEdgesChange={handleEdgeChanges} // Handle edge changes
          onConnect={onConnect} // Handle edge connections
          onSelectionChange={(elements) =>
            setSelectedElements(
              elements && Array.isArray(elements)
                ? elements.map((el) => el.id)
                : []
            )
          } // Track selected elements
          onNodeDoubleClick={onNodeDoubleClick} // Handle node renaming
          selectNodesOnDrag // Enables selection by dragging a rectangle
          fitView
        />
      </div>

      <div style={{ width: "20%", padding: "10px", background: "#f4f4f4" }}>
        <h3>Map Details</h3>
        <button onClick={addNode} style={{ marginBottom: "10px" }}>Add Node</button>
        <button onClick={onDelete} style={{ marginBottom: "10px" }}>Delete Selected</button>
        <div>
          <label>Map Name:</label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              updateFirebase(nodes, edges);
            }}
            placeholder="Enter map name"
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Map Description:</label>
          <textarea
            value={mapDescription}
            onChange={(e) => {
              setMapDescription(e.target.value);
              updateFirebase(nodes, edges);
            }}
            placeholder="Enter map description"
            style={{ width: "100%", height: "100px" }}
          />
        </div>
      </div>
    </div>
  );
};

const MapEditorWithParams = ({ mapId }) => (
  <ReactFlowProvider>
    <MapEditor mapId={mapId} />
  </ReactFlowProvider>
);

export default MapEditorWithParams;
