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

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

// Socket.IO client setup
const socket = io("http://localhost:5000"); // Connect to your Socket.IO server

const initialNodes = [
  { id: "1", data: { label: "Node 1" }, position: { x: 250, y: 5 } },
];

const initialEdges = [];

const MapEditor = ({ mapId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(2);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");

  

  const navigate = useNavigate();

  // Load existing map data when the component mounts
  useEffect(() => {
    const loadMapData = async () => {
      if (mapId) {
        const mapRef = doc(db, "maps", mapId);
        const mapSnapshot = await getDoc(mapRef);
        if (mapSnapshot.exists()) {
          const mapData = mapSnapshot.data();
          setMapName(mapData.name);
          setMapDescription(mapData.description || "");
          setNodes(mapData.nodes || initialNodes);
          setEdges(mapData.edges || initialEdges);
        }
      }
    };

    loadMapData();
  }, [mapId]);

  // Listen for real-time updates from the server (other clients)
  useEffect(() => {
    console.log("MapEditor rendered!");
    socket.on("node-added", (newNode) => {
      setNodes((nds) => [...nds, newNode]);
    });

    socket.on("edge-added", (newEdge) => {
      setEdges((eds) => addEdge(newEdge, eds));
    });

    return () => {
      socket.off("node-added");
      socket.off("edge-added");
    };
  }, [nodes, edges]);

  // Function to add a new node
  const addNode = useCallback(() => {
    const newNode = {
      id: nodeId.toString(),
      data: { label: `Node ${nodeId}` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes((nds) => [...nds, newNode]);
    socket.emit("node-added", newNode); // Emit node-added event to server
    setNodeId((id) => id + 1);
  }, [nodeId, setNodes]);

  // Function to handle node click for selecting nodes to connect
  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNodes((prev) => {
        if (prev.length === 2) return [node]; // Reset selection if two nodes are already selected
        if (prev.find((n) => n.id === node.id)) return prev; // Avoid duplicates
        return [...prev, node];
      });
    },
    [setSelectedNodes]
  );

  // Function to add a new edge between selected nodes
  const addEdgeHandler = useCallback(() => {
    if (selectedNodes.length === 2) {
      const newEdge = {
        id: `e${selectedNodes[0].id}-${selectedNodes[1].id}`,
        source: selectedNodes[0].id,
        target: selectedNodes[1].id,
        markerEnd: { type: "arrow" },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      socket.emit("edge-added", newEdge); // Emit edge-added event to server
      setSelectedNodes([]);
    } else {
      alert("Please select two nodes to connect.");
    }
  }, [selectedNodes, setEdges]);

  // Save map data to Firebase
  const saveMap = async () => {
    if (!mapName.trim()) return alert("Map name is required.");
    const mapRef = doc(db, "maps", mapId);
    await updateDoc(mapRef, {
      name: mapName,
      description: mapDescription,
      nodes,
      edges,
    });
    alert("Map saved successfully!");
  };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex" }}>
      <div style={{ width: "80%", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        />
      </div>


      <div style={{ width: "20%", padding: "10px", background: "#f4f4f4" }}>
        <h3>Map Details</h3>
        
        <button onClick={addNode} style={{ marginBottom: "10px" }}>
          Add Node
        </button>
        <button onClick={addEdgeHandler}>Add Edge</button>

        <div style={{ marginTop: "20px" }}>
          <h4>Selected Nodes</h4>
          {selectedNodes.map((node) => (
            <div key={node.id}>Node {node.id}</div>
          ))}
        </div>

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
  );
};

// React Flow Provider Wrapper
const MapEditorWithParams = ({ mapId }) => (
  <ReactFlowProvider>
    <MapEditor mapId={mapId} />
  </ReactFlowProvider>
);

export default MapEditorWithParams;

