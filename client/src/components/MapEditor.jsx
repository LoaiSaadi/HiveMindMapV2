import React, { useState, useCallback, useEffect, useRef } from "react"; 
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Panel,

} from "reactflow";
import "reactflow/dist/style.css";
import { doc, updateDoc, onSnapshot, setDoc,collection, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import ParticipantBox from "./ParticipantBox";
import { getAuth } from "firebase/auth";
import "../styles/MapEditor.css";
// Add this new component
const ContextMenu = ({ onClick, onClose, position, onRename }) => {
  if (!position) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        padding: '8px',
      }}
      className="context-menu"
    >
      <button
        onClick={() => {
          onClick();
          onClose();
        }}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          borderRadius: '2px',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        Add Node
      </button>
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          borderRadius: '2px',
        }}
      >
        Rename Node
      </button>
    </div>
  );
};
const auth = getAuth();
const currentUserId = auth.currentUser?.uid;


const socket = io("http://localhost:5000");

const initialNodes = [
  {
    id: "1",
    data: { label: "Node 1" },
    position: { x: 250, y: 5 },
    style: { border: "2px solid #000000" },
    
  },
];

const initialEdges = [];

const MapEditor = ({ mapId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(2);
  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [mapCreator, setMapCreator] = useState(""); // To store the creator's username
  const [lastEdited, setLastEdited] = useState(""); // To store the last edited timestamp
  const [selectedNode, setSelectedNode] = useState(null); // To store the currently selected node
  const [borderColor, setBorderColor] = useState("#000000"); // Default border color
  const [textColor, setTextColor] = useState("#000000");
  const [nodeNotes, setNodeNotes] = useState({});
  const prevNodeNotesRef = useRef(nodeNotes);
  const [nodeData, setNodeData] = useState({}); // { nodeId: { note, link } }
  const [contextMenu, setContextMenu] = useState(null);
  const prevNodeDataRef = useRef(nodeData);
  const noteInputRef = useRef(null);
  const [cursors, setCursors] = useState({});
  const reactFlowWrapper = useRef(null); // Ref for ReactFlow wrapper
  const [disableShortcuts, setDisableShortcuts] = useState(false);
  const [nodeCreators, setNodeCreators] = useState({})
  const nodeDetailsPanelRef = useRef(null); 
  const [showNodeDetails, setShowNodeDetails] = useState(false);


  // Refs to track previous state
  const prevNodesRef = useRef(nodes);
  const prevEdgesRef = useRef(edges);

  const navigate = useNavigate();
  // Ref to store previous data from Firebase to compare and avoid unnecessary updates
  const prevMapDataRef = useRef(null);

    // Function to refresh the page
    const refreshPage = () => {
      window.location.reload();
    };

  const updateFirebase = useCallback(
    (newNodes, newEdges) => {
      if (!firebaseInitialized) return; // Avoid updating Firebase before initialization
      console.log("Updating Firebase with nodes:", newNodes);
      console.log("Edges:", newEdges);
      // Only update if nodes or edges have actually changed
      if (JSON.stringify(newNodes) !== JSON.stringify(prevNodesRef.current) || 
          JSON.stringify(newEdges) !== JSON.stringify(prevEdgesRef.current) ||
          JSON.stringify(nodeNotes) !== JSON.stringify(prevNodeNotesRef.current ||
          JSON.stringify(nodeData) !== JSON.stringify(prevNodeDataRef.current)
          )) {
        const mapRef = doc(db, "maps", mapId);
        updateDoc(mapRef, {
          nodes: newNodes,
          edges: newEdges,
          name: mapName,
          description: mapDescription,
          lastEdited: new Date(),
          nodeNotes: nodeNotes,
          nodeData: nodeData,
        }).catch((err) => console.error("Firebase update failed:", err));
        
        // Update refs to current values
        prevNodesRef.current = newNodes;
        prevEdgesRef.current = newEdges;
        prevNodeNotesRef.current = nodeNotes;
        prevNodeDataRef.current = nodeData;
      }
    },
    [firebaseInitialized, mapId, mapName, mapDescription,nodeNotes,nodeData]
  );
  const updateCursor = useCallback(
    async (x, y) => {
      try {
        const cursorData = {
          x,
          y,
          username: auth.currentUser?.displayName || "Unknown User",
          color: "#FF5733", // Unique color for this user
        };
        const cursorRef = doc(db, `maps/${mapId}/cursors/${currentUserId}`);
        await setDoc(cursorRef, cursorData);
      } catch (err) {
        console.error("Cursor update failed:", err);
      }
    },
    [mapId, currentUserId]
  );
  // const onConnect = useCallback(
  //   (params) => {
  //     setEdges((eds) => {
  //       const updatedEdges = addEdge(params, eds);
  //       updateFirebase(nodes, updatedEdges); // update Firebase only when there's a real change
  //       return updatedEdges;
  //     });
  //     socket.emit("edge-added", params);
  //   },
  //   [nodes, updateFirebase]
  // );

  // const onConnect = useCallback(
  //   (params) => {
  //     // Show a prompt or modal to the user to select the edge style
  //     const edgeStyle = window.prompt(
  //       "Choose edge style: 'arrow', 'no-arrow', or 'dashed'"
  //     );
  
  //     // Define the edge style based on the user's choice
  //     let edgeOptions = {};
  //     switch (edgeStyle) {
  //       case "arrow":
  //         edgeOptions = { markerEnd: { type: "arrowclosed" } };
  //         break;
  //       case "dashed":
  //         edgeOptions = { style: { strokeDasharray: "5,5" } };
  //         break;
  //       case "no-arrow":
  //       default:
  //         edgeOptions = {}; // Default solid line without arrow
  //         break;
  //     }
  
  //     // Add the new edge with the chosen style
  //     setEdges((eds) => {
  //       const updatedEdges = addEdge({ ...params, ...edgeOptions }, eds);
  //       updateFirebase(nodes, updatedEdges); // Update Firebase
  //       return updatedEdges;
  //     });
  
  //     // Emit the event to other clients
  //     socket.emit("edge-added", { ...params, ...edgeOptions });
  //   },
  //   [nodes, updateFirebase]
  // );
  useEffect(() => {
    const handleClickOnMap = (event) => {
      // Check if the click is within the map background
      if (
        showNodeDetails &&
        reactFlowWrapper.current && // Ensure the ref is set
        reactFlowWrapper.current.contains(event.target) && // Click is inside the map
        (!nodeDetailsPanelRef.current || !nodeDetailsPanelRef.current.contains(event.target)) // Click is not inside the panel
      ) {
        console.log("Click on the map background detected, closing the panel.");
        setShowNodeDetails(false); // Close the panel
      }
    };
  
    // Add the click event listener to the document
    document.addEventListener("mousedown", handleClickOnMap);
  
    // Cleanup the listener
    return () => {
      document.removeEventListener("mousedown", handleClickOnMap);
    };
  }, [showNodeDetails]);
/*useEffect(() => {
    const handleClickOutsidePanel = (event) => {
      if (showNodeDetails && nodeDetailsPanelRef.current && !nodeDetailsPanelRef.current.contains(event.target)) {
        setShowNodeDetails(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsidePanel); // Use mousedown for better UX

    return () => {
      document.removeEventListener("mousedown", handleClickOutsidePanel);
    };
  }, [showNodeDetails]);*/

  const onConnect = useCallback(
    (params) => {
      // Create the modal container
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.backgroundColor = "white";
      modal.style.padding = "20px";
      modal.style.border = "1px solid #ccc";
      modal.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
      modal.style.zIndex = "1000";
      modal.style.textAlign = "center";
  
      // Create a title for the modal
      const title = document.createElement("h3");
      title.innerText = "Choose Edge Style";
      modal.appendChild(title);
  
      // Helper function to create buttons
      const createButton = (label, svgContent, styleCallback) => {
        const button = document.createElement("button");
        button.style.margin = "10px";
        button.style.padding = "10px";
        button.style.border = "1px solid #ddd";
        button.style.backgroundColor = "#f9f9f9";
        button.style.cursor = "pointer";
        button.innerHTML = svgContent;
        button.onclick = () => {
          styleCallback();
          document.body.removeChild(modal); // Close modal
        };
        modal.appendChild(button);
      };
  
      // Add arrow button
      createButton(
        "Arrow",
        `<svg height="30" width="80">
           <line x1="0" y1="15" x2="60" y2="15" stroke="black" stroke-width="2" />
           <polygon points="60,10 70,15 60,20" fill="black" />
         </svg>`,
        () => {
          setEdges((eds) => {
            const updatedEdges = addEdge(
              { ...params, markerEnd: { type: "arrowclosed" } },
              eds
            );
            updateFirebase(nodes, updatedEdges);
            return updatedEdges;
          });
          socket.emit("edge-added", { ...params, markerEnd: { type: "arrowclosed" } });
        }
      );
  
      // Add dashed button
      createButton(
        "Dashed",
        `<svg height="30" width="80">
           <line x1="0" y1="15" x2="70" y2="15" stroke="black" stroke-width="2" stroke-dasharray="5,5" />
         </svg>`,
        () => {
          setEdges((eds) => {
            const updatedEdges = addEdge(
              { ...params, style: { strokeDasharray: "5,5" } },
              eds
            );
            updateFirebase(nodes, updatedEdges);
            return updatedEdges;
          });
          socket.emit("edge-added", { ...params, style: { strokeDasharray: "5,5" } });
        }
      );
  
      // Add no-arrow button
      createButton(
        "No Arrow",
        `<svg height="30" width="80">
           <line x1="0" y1="15" x2="70" y2="15" stroke="black" stroke-width="2" />
         </svg>`,
        () => {
          setEdges((eds) => {
            const updatedEdges = addEdge({ ...params }, eds);
            updateFirebase(nodes, updatedEdges);
            return updatedEdges;
          });
          socket.emit("edge-added", { ...params });
        }
      );
  
      // Add the modal to the document
      document.body.appendChild(modal);
    },
    [nodes, updateFirebase]
  );
  
  
  
  const handleNoteChange = (event) => {
    const newNote = event.target.value;
    if (selectedNode) {
      setNodeNotes((prevNotes) => {
        const updatedNotes = { ...prevNotes, [selectedNode.id]: newNote };
        return updatedNotes;
      });
      // Optionally debounce Firebase updates instead of updating it on every key press
    }
  };
  

  const handleNoteBlur = () => {
    // Update Firebase when input loses focus (optional)
    if (selectedNode) {
      const newNote = noteInputRef.current.value;
      setNodeNotes((prevNotes) => ({
        ...prevNotes,
        [selectedNode.id]: newNote,
      }));
      updateFirebase(nodes, edges);
    }
  };
  const onContextMenu = useCallback((event) => {
    event.preventDefault();
    
    const reactFlowBounds = event.target.getBoundingClientRect(); // Get ReactFlow container bounds
    const x = event.clientX - reactFlowBounds.left; // Adjust to ReactFlow bounds
    const y = event.clientY - reactFlowBounds.top;
  
    setContextMenu({ x, y });
  }, []);
   
  
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu) {
        closeContextMenu(); // Close the menu if it's open and a click happens outside
      }
    };
  
    document.addEventListener("click", handleClickOutside);
  
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu, closeContextMenu]);

  const handleSelectionChange = useCallback((elements) => {
    const newSelectedElements = elements && Array.isArray(elements) ? elements.map((el) => el.id) : [];
    
    // Only update state if selected elements have changed
    if (JSON.stringify(newSelectedElements) !== JSON.stringify(selectedElements)) {
      setSelectedElements(newSelectedElements);
    }
  }, [selectedElements]);

  const handleNodeChanges = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        updateFirebase(updatedNodes, edges); // update Firebase only when there's a real change
        return updatedNodes;
      });
    },
    [edges, updateFirebase]
  );

  const handleEdgeChanges = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        updateFirebase(nodes, updatedEdges); // update Firebase only when there's a real change
        return updatedEdges;
      });
    },
    [nodes, updateFirebase]
  );

  const addNode = useCallback(async (position = { x: Math.random() * 400, y: Math.random() * 400 }) => {
    const newNodeId = nodes.length ? Math.max(...nodes.map((node) => parseInt(node.id))) + 1 : 1;
    const auth = getAuth();
    const currentUser = auth.currentUser;
    // console.log("l;l;l;l;ll;;l;")
    // console.log(currentUser.displayName)

    const newNode = {
      id: newNodeId.toString(),
      data: { label: `Node ${newNodeId}` },
      position,
      style: { border: `2px solid ${borderColor}` },
      creator: currentUser?.uid || "unknown", // Store creator UID
      creationTimestamp: new Date().toISOString(), // Store creation timestamp
    };

    setNodes((nds) => {
      const updatedNodes = [...nds, newNode];
      updateFirebase(updatedNodes, edges);
      return updatedNodes;
    });

    setNodeId((id) => id + 1);
    socket.emit("node-added", newNode);

    // Fetch and store creator info immediately after adding the node
    if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
            setNodeCreators(prev => ({...prev, [newNode.id]: userDoc.data()}))
        }
    }
  }, [nodes, edges, updateFirebase, borderColor]);
  

  const onNodeDoubleClick = useCallback((event, node) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, isEditing: true } } : n
      )
    );
  }, []);
  const handleLabelChange = (event, nodeId) => {
    const newLabel = event.target.value;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
      )
    );
  };
  
  const handleLabelBlur = (nodeId) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, isEditing: false } } : n
      )
    );
  };
  useEffect(() => {
    const fetchNodeCreators = async () => {
        const creatorIds = [...new Set(nodes.map(n => n.creator).filter(c => c !== "unknown"))];

        if (creatorIds.length === 0) { // Add this check
            return; // Exit early if no creator IDs
        }

        const newCreators = {};
        for (const creatorId of creatorIds) {
            try { //Add try catch for error handling
                const userDoc = await getDoc(doc(db, "users", creatorId));
                if (userDoc.exists()) {
                    newCreators[creatorId] = userDoc.data();
                }
            } catch (error) {
                console.error("Error fetching creator data:", error);
            }
        }
        setNodeCreators(prev => {
            const existingCreators = {...prev};
            for (const creatorId in newCreators){
                existingCreators[creatorId] = newCreators[creatorId];
            }
            return existingCreators;
        });
    }

    if (nodes.length > 0) {
        fetchNodeCreators();
    }
}, [nodes]);







const renderNode = (node) => {
  const creatorInfo = nodeCreators[node.creator];
  console.log(creatorInfo);

  const creationDate = new Date(node.creationTimestamp).toLocaleDateString();
  // const creatorName = creatorInfo?.displayName || (node.creator === "unknown" ? "Unknown Creator" : "Fetching...");
  // const creatorPhoto = creatorInfo?.profilePicture;

  // Check if creatorInfo exists before accessing properties
  const creatorUsername = creatorInfo?.username || "Unknown Username"; 

  if (node.data.isEditing) {
    return (
      <input
        type="text"
        value={node.data.label}
        onFocus={() => setDisableShortcuts(true)} // Disable shortcuts
        onBlur={() => {
          handleLabelBlur(node.id);
          setDisableShortcuts(false); // Enable shortcuts
        }}
        onChange={(e) => handleLabelChange(e, node.id)}
        onKeyDown={(e) => {
          e.stopPropagation(); // Prevent global `keydown`
          if (e.key === "Enter") {
            handleLabelBlur(node.id);
            setDisableShortcuts(false); // Enable shortcuts
          }
        }}
        autoFocus
        style={{ width: "100%" }}
      />
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%'}}>
      <div style={{
        position: 'absolute',
        top: '-50px', // Adjust as needed
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '5px',
        borderRadius: '5px',
        fontSize: '10px',
        whiteSpace: 'nowrap',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
      }}>
        {creatorInfo?.profilePicture && (
          <img
            src={creatorInfo.profilePicture}
            alt="Creator Avatar"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              marginRight: '5px',
            }}
          />
        )}
        <span>{creatorUsername}</span> ({creationDate})
      </div>
      {node.data.isEditing ? (
        <input
          // ... (existing input code)
        />
      ) : (
        <span>{node.data.label}</span>
      )}
    </div>
  );
};

  useEffect(() => {
    const mapRef = doc(db, "maps", mapId);

    const unsubscribe = onSnapshot(mapRef, (doc) => {
        if (doc.exists()) {
            const mapData = doc.data();
            // ... other state updates
            setNodes(mapData.nodes || []); // Update nodes first
        }
    });
    return () => unsubscribe();
}, [mapId]);
  const onDelete = useCallback(() => {
    const remainingNodes = nodes.filter((node) => !selectedElements.includes(node.id));
    const remainingEdges = edges.filter((edge) => !selectedElements.includes(edge.id));
    setNodes(remainingNodes);
    setEdges(remainingEdges);
    setSelectedElements([]);
    updateFirebase(remainingNodes, remainingEdges); // update Firebase only when there's a real change
    socket.emit("elements-deleted", selectedElements);
  }, [nodes, edges, selectedElements, updateFirebase]);

  useEffect(() => {
    const mapRef = doc(db, "maps", mapId);

    const unsubscribe = onSnapshot(mapRef, (doc) => {
      if (doc.exists()) {
        const mapData = doc.data();

        // Check if map data is different before updating state
        if (
          !prevMapDataRef.current ||
          JSON.stringify(prevMapDataRef.current.nodes) !== JSON.stringify(mapData.nodes) ||
          JSON.stringify(prevMapDataRef.current.edges) !== JSON.stringify(mapData.edges) ||
          prevMapDataRef.current.name !== mapData.name ||
          prevMapDataRef.current.description !== mapData.description ||
          JSON.stringify(prevMapDataRef.current.nodeNotes) !== JSON.stringify(mapData.nodeNotes)||
          JSON.stringify(prevMapDataRef.current.nodeData) !== JSON.stringify(mapData.nodeData)
        ) {
          setNodes(mapData.nodes || []);
          setEdges(mapData.edges || []);
          setMapName(mapData.name || "");
          setMapDescription(mapData.description || "");
          setNodeNotes(mapData.nodeNotes || {});
          setNodeData(mapData.nodeData || {});
          setLastEdited(mapData.lastEdited?.toDate().toLocaleString() || "Not available");
          setMapCreator(mapData.creator || "Unknown");
          setFirebaseInitialized(true); // Firebase data is now loaded
          prevMapDataRef.current = mapData; // Update ref with new data
        }
      }
    });

    return () => unsubscribe();
  }, [mapId]); // Only re-run when mapId changes
  useEffect(() => {
    const handleMouseMove = (event) => {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      updateCursor(x, y);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [updateCursor]);

  const predefinedColors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#A833FF", "#33FFF5", "#FFC233",
    "#FF3333", "#33FF8E", "#8E33FF", "#FF8E33", "#33A8FF", "#57FF33",
  ];
  
  useEffect(() => {
    const cursorsRef = collection(db, `maps/${mapId}/cursors`);
    
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      const newCursors = {};
      snapshot.forEach((doc, index) => {
        newCursors[doc.id] = {
          ...doc.data(),
          color: predefinedColors[index % predefinedColors.length], // Assign a color from the predefined list
        };
      });
      setCursors(newCursors);
    });
  
    return () => unsubscribe();
  }, [mapId]);


  useEffect(() => {
    const handleKeyDown = (event) => {
      if (disableShortcuts) return;
  
      if (event.key === "Delete" || event.key === "Backspace") {
        onDelete();
      } else if (event.key === "n" || event.key === "N") {
        addNode();
      }
    };
  
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, addNode, disableShortcuts]);


  // Handle node click to select it
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node); // Set the selected node
    setBorderColor(node.style?.border?.split(" ")[2] || "#000000"); // Extract the current border color
    setShowNodeDetails(true);
  }, []);

  // Update the selected node's border color
  const handleBorderColorChange = (color) => {
    if (selectedNode) {
      const updatedNodes = nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, style: { ...node.style, border: `2px solid ${color}` } }
          : node
      );
      setNodes(updatedNodes);
      setBorderColor(color);
      updateFirebase(updatedNodes, edges); // Update Firebase with the new color
    }
  };


  const handleLinkChange = (link) => {
    if (selectedNode) {
      setNodeData((prevData) => ({
        ...prevData,
        [selectedNode.id]: {
          ...prevData[selectedNode.id],
          link,
        },
      }));
      updateFirebase(nodes, edges); // Update Firebase with the new link
    }
  };
  

  return (
    <div ref={reactFlowWrapper} style={{ backgroundColor: "#d9fdd3", width: "100%", height: "100vh", position: "relative" }}>
      <div style={{ width: "80%", height: "100%" }}>
      <Panel position="top-left">
      <div className="description" style={{ padding: '10px', background:"linear-gradient(to bottom, #4caf50, #81c784)",color: "#ffffff", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", borderRadius: '4px' }}>
      <p>Keyboard Shortcuts:</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        <li><strong>N:</strong> Add a new node</li>
        <li><strong>Del/Backspace:</strong> Delete selected node</li>
        <li><strong>Right-click:</strong> Rename a node , Add node</li>
      </ul>
      <p>Total Nodes: {nodes.length}</p>
    </div>
      </Panel>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              label: renderNode(node),
            },
          }))}
          edges={edges}
          onNodesChange={handleNodeChanges}
          onEdgesChange={handleEdgeChanges}
          onContextMenu={onContextMenu}
          onConnect={onConnect}
          onPaneClick={() => setShowNodeDetails(false)} // Close panel on background click
          onNodeClick={onNodeClick} // Handle node click
          onSelectionChange={handleSelectionChange} // Use the optimized selection handler
          onNodeDoubleClick={onNodeDoubleClick}
          selectNodesOnDrag
          fitView
        />
{Object.entries(cursors).map(([id, cursor]) => (
  <div
    key={id}
    style={{
      position: "absolute",
      left: cursor.x,
      top: cursor.y,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        padding: "4px 8px",
        background: "#2C5F2D",
        color: "white", // Ensure text contrast
        fontWeight: "bold",
        fontSize: "12px",
        borderRadius: "8px",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        whiteSpace: "nowrap",
        textAlign: "center",
        marginBottom: "6px", // Space between the label and the circle
      }}
    >
      {cursor.username}
    </div>
    <div
      style={{
        width: "10px",
        height: "10px",
        background: cursor.color,
        borderRadius: "50%",
      }}
    ></div>
  </div>
))}



      
        {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          onClick={() => addNode({ x: contextMenu.x, y: contextMenu.y })}
          onRename={() => selectedNode && onNodeDoubleClick(null, selectedNode)}
          onClose={closeContextMenu}
        />
      )}
      </div>

      <div style={{zIndex:1000, position:"absolute" ,  width: "20%", padding: "10px",right: "0",top:"0", background: "#f4f4f4",height: "100%",overflowY: "auto",boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", }}>
        <h3 style={{ color: "#2C5F2D" }}>Map Details</h3>
        
        
        {/* <button onClick={onDelete} style={{ marginBottom: "10px" }}>Delete Selected</button> */}
        <div>
          <button className="home-button" onClick={refreshPage}>
            Home Page
          </button>
        </div>
        <div>
          <label style={{ color: "#2C5F2D" }}>Map Name:</label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            onBlur={() => updateFirebase(nodes, edges)}
            placeholder="Enter map name"
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label style={{ color: "#2C5F2D" }}>Map Description:</label>
          <textarea
            value={mapDescription}
            onChange={(e) => setMapDescription(e.target.value)}
            onBlur={() => updateFirebase(nodes, edges)}
            placeholder="Enter map description"
            style={{ width: "100%", height: "100px" }}
          />
        </div>
        <div>
          <label style={{ color: "#2C5F2D" }}>Map ID:</label>
          <p>{mapId}</p>
        </div>
        <div>
          <label style={{ color: "#2C5F2D" }}>Last Edited:</label>
          <p>{lastEdited}</p>
        </div>





        
        <div
      style={{
        zIndex: 1000, // Ensure it's above other elements
        position: "absolute", // Or "fixed" depending on your layout
        top: 0,
        right: 0,
        width: "100%",
        padding: "10px",
        background: "#f4f4f4",
        height: "100%",
        overflowY: "auto",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.3s",
        transform: showNodeDetails ? "translateX(0)" : "translateX(100%)", // Conditional transform
      }}
      ref={nodeDetailsPanelRef} // The important ref
    >
      <button
        onClick={() => setShowNodeDetails(false)}
        style={{ position: "absolute", top: "10px", left: "10px" }}
      >
        Exit
      </button>
          {/* Color Picker for Selected Node's Border */}
          {selectedNode && (
            <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#fff" }}>
              <h4 style={{ marginBottom: "10px", textAlign: "center", color: "#00796b" }}>
                Node Details
              </h4>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#388e3c" }}>
                  Border Color:
                </label>
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => handleBorderColorChange(e.target.value)} 
                  style={{ width: "100%", height: "40px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#388e3c" }}>
                  Notes:
                </label>
                <textarea
                  ref={noteInputRef}
                  value={nodeNotes[selectedNode.id] || ""}
                  onChange={handleNoteChange}
                  onBlur={handleNoteBlur}
                  placeholder="Add a note for this node"
                  style={{
                    width: "80%",
                    height: "50px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    fontFamily: "'Arial', sans-serif",
                    backgroundColor: "#f9f9f9",
                    resize: "none",
                  }}
                />
              </div>

              {/* Link Input */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px", color: "#388e3c" }}>
                  Link:
                </label>
                <input
                  type="text"
                  value={nodeData[selectedNode.id]?.link || ""}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="Add a link"
                  style={{
                    width: "80%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              {selectedNode && nodeData[selectedNode.id]?.link && (
                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontWeight: "bold", color: "#388e3c" }}>Link:</label>
                  <a 
                    href={nodeData[selectedNode.id].link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ wordBreak: "break-word" }}
                  >
                    {nodeData[selectedNode.id].link}
                  </a>
                </div>
                
              )}



            </div>
          )}
          </div>

        <ParticipantBox mapId={mapId} currentUserId={currentUserId} />

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