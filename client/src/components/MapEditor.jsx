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
import { createClient } from "@supabase/supabase-js";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import ParticipantBox from "./ParticipantBox";
import "../styles/MapEditor.css";

// ================== Supabase & Socket ==================

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const socket = io("http://localhost:5000");

// ================== Helpers ==================

const parseJSONField = (value, fallback) => {
  if (value == null) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error("Failed to parse JSON field:", value, e);
      return fallback;
    }
  }
  return fallback;
};

const serializeJSONField = (value) => {
  try {
    return JSON.stringify(value ?? null);
  } catch (e) {
    console.error("Failed to serialize JSON field:", value, e);
    return JSON.stringify(null);
  }
};

// ================== Context Menu ==================

const ContextMenu = ({ onClick, onClose, position, onRename }) => {
  if (!position) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        borderRadius: "4px",
        padding: "8px",
      }}
      className="context-menu"
    >
      <button
        onClick={() => {
          onClick();
          onClose();
        }}
        style={{
          display: "block",
          width: "100%",
          padding: "8px 12px",
          textAlign: "left",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          borderRadius: "2px",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
      >
        Add Node
      </button>
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        style={{
          display: "block",
          width: "100%",
          padding: "8px 12px",
          textAlign: "left",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          borderRadius: "2px",
        }}
      >
        Rename Node
      </button>
    </div>
  );
};

// ================== Initial Data ==================

const initialNodes = [
  {
    id: "1",
    data: { label: "Node 1" },
    position: { x: 250, y: 5 },
    style: { border: "2px solid #000000" },
  },
];

const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    label: "Default Edge",
    style: { stroke: "#000000" },
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#000000",
    },
  },
];

// ================== MapEditor ==================

const MapEditor = ({ mapId }) => {
  // -------- Auth & user --------
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // -------- Cursors --------
  const [localCursor, setLocalCursor] = useState({ x: 0, y: 0 });
  const [remoteCursors, setRemoteCursors] = useState({});
  const [displayedCursors, setDisplayedCursors] = useState({});
  const [cursors, setCursors] = useState({});
  const cursorUpdateInterval = useRef(null);

  // -------- React Flow --------
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  const [nodeId, setNodeId] = useState(2);
  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [mapCreator, setMapCreator] = useState("");
  const [lastEdited, setLastEdited] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [borderColor, setBorderColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#000000");
  const [nodeNotes, setNodeNotes] = useState({});
  const prevNodeNotesRef = useRef(nodeNotes);
  const [nodeData, setNodeData] = useState({});
  const prevNodeDataRef = useRef(nodeData);
  const [contextMenu, setContextMenu] = useState(null);
  const noteInputRef = useRef(null);
  const reactFlowWrapper = useRef(null);
  const [disableShortcuts, setDisableShortcuts] = useState(false);
  const [nodeCreators, setNodeCreators] = useState({});
  const nodeDetailsPanelRef = useRef(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showEdgeDetails, setShowEdgeDetails] = useState(false);
  const edgeDetailsPanelRef = useRef(null);
  const [edgeLabel, setEdgeLabel] = useState("");

  const prevNodesRef = useRef(nodes);
  const prevEdgesRef = useRef(edges);
  const prevMapDataRef = useRef(null);

  const navigate = useNavigate();

  const refreshPage = () => {
    window.location.reload();
  };

  // ================== Auth init ==================
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user?.id) {
          setCurrentUserId(user.id);

          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!profileError && profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUserId(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ================== Supabase UPDATE ==================

  const updateSupabase = useCallback(
    async (newNodes, newEdges) => {
      if (!mapId) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
          .from("maps")
          .update({
            nodes: serializeJSONField(newNodes),
            edges: serializeJSONField(newEdges),
            name: mapName || "Untitled Map",
            description: mapDescription || "",
            last_edited: new Date().toISOString(),
            node_notes: serializeJSONField(nodeNotes),
            node_data: serializeJSONField(nodeData),
          })
          .eq("id", mapId);

        if (error) {
          console.error("❌ Supabase update failed:", error);
        } else {
          prevNodesRef.current = newNodes;
          prevEdgesRef.current = newEdges;
          prevNodeNotesRef.current = nodeNotes;
          prevNodeDataRef.current = nodeData;
        }
      } catch (error) {
        console.error("❌ Unexpected error in updateSupabase:", error);
      }
    },
    [mapId, mapName, mapDescription, nodeNotes, nodeData]
  );

  // ================== Cursor logic ==================

  useEffect(() => {
    if (!currentUserId || !mapId) return;

    const updateCursor = async (x, y) => {
      try {
        const { error } = await supabase.from("cursors").upsert(
          {
            user_id: currentUserId,
            map_id: mapId,
            x,
            y,
            username: userProfile?.username || "You",
            color: "#4CAF50",
            last_updated: new Date().toISOString(),
          },
          { onConflict: "user_id,map_id" }
        );

        if (error) throw error;
      } catch (error) {
        console.error("Cursor update error:", error);
      }
    };

    const handleMouseMove = (e) => {
      if (!reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      setLocalCursor({ x, y });
    };

    document.addEventListener("mousemove", handleMouseMove);

    cursorUpdateInterval.current = setInterval(async () => {
      await updateCursor(localCursor.x, localCursor.y);

      setDisplayedCursors((prev) => ({
        ...prev,
        [currentUserId]: {
          ...localCursor,
          user_id: currentUserId,
          username: "You",
          color: "#4CAF50",
        },
      }));
    }, 2000);

    return () => {
      clearInterval(cursorUpdateInterval.current);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [currentUserId, mapId, userProfile, localCursor]);

  useEffect(() => {
    if (!mapId) return;

    const fetchCursors = async () => {
      const { data, error } = await supabase
        .from("cursors")
        .select("*")
        .eq("map_id", mapId);

      if (!error && data) {
        const cursorsMap = {};
        data.forEach((cursor) => {
          cursorsMap[cursor.user_id] = cursor;
        });
        setCursors(cursorsMap);
        setRemoteCursors(cursorsMap);
        setDisplayedCursors(cursorsMap);
      }
    };

    fetchCursors();

    const subscription = supabase
      .channel("cursor_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cursors",
          filter: `map_id=eq.${mapId}`,
        },
        (payload) => {
          setCursors((prev) => {
            const newCursors = { ...prev };
            if (payload.eventType === "DELETE") {
              delete newCursors[payload.old.user_id];
            } else {
              newCursors[payload.new.user_id] = payload.new;
            }
            return newCursors;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [mapId]);

  const renderCursors = () => {
    if (!reactFlowWrapper.current) return null;

    return Object.values(displayedCursors).map((cursor) => {
      if (!cursor || cursor.x === undefined || cursor.y === undefined) return null;

      const isYou = cursor.user_id === currentUserId;
      const color = isYou ? "#4CAF50" : "#2C5F2D";

      return (
        <div
          key={cursor.user_id}
          style={{
            position: "absolute",
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: "4px 8px",
              background: color,
              color: "white",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
            }}
          >
            {isYou ? "You" : cursor.username || "Anonymous"}
          </div>
          <div
            style={{
              width: "12px",
              height: "12px",
              background: color,
              borderRadius: "50%",
              border: isYou ? "2px solid white" : "none",
              margin: "0 auto",
            }}
          />
        </div>
      );
    });
  };

  // ================== Node creators ==================

  useEffect(() => {
    const fetchNodeCreators = async () => {
      const creatorIds = [
        ...new Set(nodes.map((n) => n.creator).filter((c) => c && c !== "unknown")),
      ];
      if (creatorIds.length === 0) return;

      const newCreators = {};
      for (const creatorId of creatorIds) {
        try {
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", creatorId)
            .single();
          if (!error && userData) {
            newCreators[creatorId] = userData;
          }
        } catch (error) {
          console.error("Error fetching creator data:", error);
        }
      }
      setNodeCreators((prev) => ({ ...prev, ...newCreators }));
    };

    if (nodes.length > 0) {
      fetchNodeCreators();
    }
  }, [nodes]);

  const renderNode = (node) => {
    const creatorInfo = nodeCreators[node.creator];
    const creationDate = node.creationTimestamp
      ? new Date(node.creationTimestamp).toLocaleDateString()
      : "";

    const creatorUsername = creatorInfo?.username || "Unknown Username";

    if (node.data.isEditing) {
      return (
        <input
          type="text"
          value={node.data.label}
          onFocus={() => setDisableShortcuts(true)}
          onBlur={() => {
            handleLabelBlur(node.id);
            setDisableShortcuts(false);
          }}
          onChange={(e) => handleLabelChange(e, node.id)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              handleLabelBlur(node.id);
              setDisableShortcuts(false);
            }
          }}
          autoFocus
          style={{ width: "100%" }}
        />
      );
    }

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          style={{
            position: "absolute",
            top: "-50px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "5px",
            borderRadius: "5px",
            fontSize: "10px",
            whiteSpace: "nowrap",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>{creatorUsername}</span>
          {creationDate && ` (${creationDate})`}
        </div>
        <span>{node.data.label}</span>
      </div>
    );
  };

  // ================== Handlers: edges & nodes ==================

  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
    setEdgeLabel(edge.label || "");
  }, []);

  useEffect(() => {
    const handleClickOutsideNodePanel = (event) => {
      if (
        reactFlowWrapper.current &&
        reactFlowWrapper.current.contains(event.target) &&
        (!nodeDetailsPanelRef.current ||
          !nodeDetailsPanelRef.current.contains(event.target))
      ) {
        setShowNodeDetails(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideNodePanel);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideNodePanel);
    };
  }, []);

  useEffect(() => {
    const handleClickOutsideEdgePanel = (event) => {
      if (
        reactFlowWrapper.current &&
        reactFlowWrapper.current.contains(event.target) &&
        (!edgeDetailsPanelRef.current ||
          !edgeDetailsPanelRef.current.contains(event.target))
      ) {
        setShowEdgeDetails(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideEdgePanel);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEdgePanel);
    };
  }, []);

  const onConnect = useCallback(
    (params) => {
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

      const title = document.createElement("h3");
      title.innerText = "Choose Edge Style";
      modal.appendChild(title);

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
          document.body.removeChild(modal);
        };
        modal.appendChild(button);
      };

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
            updateSupabase(nodes, updatedEdges);
            return updatedEdges;
          });
          socket.emit("edge-added", {
            ...params,
            markerEnd: { type: "arrowclosed" },
          });
        }
      );

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
            updateSupabase(nodes, updatedEdges);
            return updatedEdges;
          });
          socket.emit("edge-added", {
            ...params,
            style: { strokeDasharray: "5,5" },
          });
        }
      );

      createButton(
        "No Arrow",
        `<svg height="30" width="80">
           <line x1="0" y1="15" x2="70" y2="15" stroke="black" stroke-width="2" />
         </svg>`,
        () => {
          const defaultEdgeStyle = { stroke: "#000000" };
          setEdges((eds) => {
            const updatedEdges = addEdge(
              {
                ...params,
                style: defaultEdgeStyle,
              },
              eds
            );
            updateSupabase(nodes, updatedEdges);
            return updatedEdges;
          });
          socket.emit("edge-added", { ...params });
        }
      );

      document.body.appendChild(modal);
    },
    [nodes, updateSupabase]
  );

  const handleNoteChange = (event) => {
    const newNote = event.target.value;
    if (selectedNode) {
      setNodeNotes((prevNotes) => ({
        ...prevNotes,
        [selectedNode.id]: newNote,
      }));
    }
  };

  const handleNoteBlur = () => {
    if (selectedNode) {
      const newNote = noteInputRef.current.value;
      setNodeNotes((prevNotes) => ({
        ...prevNotes,
        [selectedNode.id]: newNote,
      }));
      updateSupabase(nodes, edges);
    }
  };

  const onContextMenu = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = event.target.getBoundingClientRect();
    const x = event.clientX - reactFlowBounds.left;
    const y = event.clientY - reactFlowBounds.top;
    setContextMenu({ x, y });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu, closeContextMenu]);

  const handleSelectionChange = useCallback(
    (elements) => {
      const newSelectedElements =
        elements && Array.isArray(elements) ? elements.map((el) => el.id) : [];

      if (
        JSON.stringify(newSelectedElements) !==
        JSON.stringify(selectedElements)
      ) {
        setSelectedElements(newSelectedElements);
      }
    },
    [selectedElements]
  );

  const handleNodeChanges = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        updateSupabase(updatedNodes, edges);
        return updatedNodes;
      });
    },
    [edges, updateSupabase]
  );

  const handleEdgeChanges = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        updateSupabase(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes, updateSupabase]
  );

  const addNode = useCallback(
    async (position = { x: Math.random() * 400, y: Math.random() * 400 }) => {
      const newNodeId = nodes.length
        ? Math.max(...nodes.map((node) => parseInt(node.id))) + 1
        : 1;

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const newNode = {
        id: newNodeId.toString(),
        data: { label: `Node ${newNodeId}` },
        position,
        style: { border: `2px solid ${borderColor}` },
        creator: currentUser?.id || "unknown",
        creationTimestamp: new Date().toISOString(),
      };

      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        updateSupabase(updatedNodes, edges).catch(console.error);
        return updatedNodes;
      });

      setNodeId((id) => id + 1);
      socket.emit("node-added", newNode);

      if (currentUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (userData) {
          setNodeCreators((prev) => ({ ...prev, [newNode.id]: userData }));
        }
      }
    },
    [nodes, edges, updateSupabase, borderColor]
  );

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

  const handleedgeLabelChange = (event) => {
    setEdgeLabel(event.target.value);
  };

  const saveEdgeLabel = () => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id ? { ...edge, label: edgeLabel } : edge
        )
      );
      setSelectedEdge(null);
    }
  };

  const handleLabelBlur = (nodeId) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, isEditing: false } } : n
      )
    );
  };

  const onDelete = useCallback(() => {
    const remainingNodes = nodes.filter(
      (node) => !selectedElements.includes(node.id)
    );
    const remainingEdges = edges.filter(
      (edge) => !selectedElements.includes(edge.id)
    );
    setNodes(remainingNodes);
    setEdges(remainingEdges);
    setSelectedElements([]);
    updateSupabase(remainingNodes, remainingEdges);
    socket.emit("elements-deleted", selectedElements);
  }, [nodes, edges, selectedElements, updateSupabase]);

  // ================== Fetch map data (JSON parse) ==================

  useEffect(() => {
    const fetchMapData = async () => {
      if (!mapId) return;

      const { data: mapData, error } = await supabase
        .from("maps")
        .select("*")
        .eq("id", mapId)
        .single();

      if (error) {
        console.error("Error fetching map:", error);
        return;
      }

      if (mapData) {
        const parsedNodes = parseJSONField(mapData.nodes, []);
        const parsedEdges = parseJSONField(mapData.edges, []);
        const parsedNotes = parseJSONField(mapData.node_notes, {});
        const parsedData = parseJSONField(mapData.node_data, {});

        if (
          !prevMapDataRef.current ||
          JSON.stringify(prevMapDataRef.current.nodes) !==
            JSON.stringify(mapData.nodes) ||
          JSON.stringify(prevMapDataRef.current.edges) !==
            JSON.stringify(mapData.edges) ||
          prevMapDataRef.current.name !== mapData.name ||
          prevMapDataRef.current.description !== mapData.description ||
          JSON.stringify(prevMapDataRef.current.node_notes) !==
            JSON.stringify(mapData.node_notes) ||
          JSON.stringify(prevMapDataRef.current.node_data) !==
            JSON.stringify(mapData.node_data)
        ) {
          setNodes(parsedNodes || []);
          setEdges(parsedEdges || []);
          setMapName(mapData.name || "");
          setMapDescription(mapData.description || "");
          setNodeNotes(parsedNotes || {});
          setNodeData(parsedData || {});
          setLastEdited(
            mapData.last_edited
              ? new Date(mapData.last_edited).toLocaleString()
              : "Not available"
          );
          setMapCreator(mapData.creator || "Unknown");
          prevMapDataRef.current = mapData;
        }
      }
    };

    fetchMapData();

    // realtime subscription
    const subscription = supabase
      .channel("map_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "maps",
          filter: `id=eq.${mapId}`,
        },
        (payload) => {
          const raw = payload.new;

          const parsedNodes = parseJSONField(raw.nodes, []);
          const parsedEdges = parseJSONField(raw.edges, []);
          const parsedNotes = parseJSONField(raw.node_notes, {});
          const parsedData = parseJSONField(raw.node_data, {});

          setNodes(parsedNodes || []);
          setEdges(parsedEdges || []);
          setMapName(raw.name || "");
          setMapDescription(raw.description || "");
          setNodeNotes(parsedNotes || {});
          setNodeData(parsedData || {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [mapId]);

  // ================== Keyboard shortcuts ==================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (disableShortcuts) return;

      const activeElement = document.activeElement;
      if (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        onDelete();
      } else if (event.key.toLowerCase() === "n") {
        addNode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, addNode, disableShortcuts]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setBorderColor(node.style?.border?.split(" ")[2] || "#000000");
    setShowNodeDetails(true);
  }, []);

  const handleBorderColorChange = (color) => {
    if (selectedNode) {
      const updatedNodes = nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, style: { ...node.style, border: `2px solid ${color}` } }
          : node
      );
      setNodes(updatedNodes);
      setBorderColor(color);
      updateSupabase(updatedNodes, edges);
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
      updateSupabase(nodes, edges);
    }
  };

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setShowEdgeDetails(true);
  }, []);

  // ================== Render ==================

  return (
    <div
      ref={reactFlowWrapper}
      style={{
        backgroundColor: "#d9fdd3",
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "80%", height: "100%" }}>
        <Panel position="top-left">
          <div
            className="description"
            style={{
              padding: "2px",
              background: "linear-gradient(to bottom, #4caf50, #81c784)",
              color: "#ffffff",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
              height: "60%",
            }}
          >
            <p>Keyboard Shortcuts:</p>
            <ul
              style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "10px" }}
            >
              <li>
                <strong>N:</strong> Add a new node
              </li>
              <li>
                <strong>Del/Backspace:</strong> Delete selected node
              </li>
              <li>
                <strong>Right-click:</strong> Rename a node , Add node
              </li>
              <li>
                <strong>Double-click on node:</strong> Rename a node
              </li>
              <li>
                <strong>Click on node:</strong> open node details
              </li>
              <li>
                <strong>Click on edge:</strong> open edge details
              </li>
              <li>
                <strong>Click on the background:</strong> close node\edge details
              </li>
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
          onPaneClick={() => {
            setShowNodeDetails(false);
            setShowEdgeDetails(false);
          }}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onSelectionChange={handleSelectionChange}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          selectNodesOnDrag
          fitView
        />

        {renderCursors()}

        {showEdgeDetails && selectedEdge && (
          <div
            ref={edgeDetailsPanelRef}
            style={{
              zIndex: 2000,
              position: "absolute",
              top: 0,
              right: 0,
              width: "300px",
              padding: "20px",
              background: "white",
              height: "100%",
              overflowY: "auto",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              borderRadius: "8px 0 0 8px",
              transform: showEdgeDetails ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s ease-in-out",
              fontFamily: "'Arial', sans-serif",
            }}
          >
            <button
              onClick={() => setShowEdgeDetails(false)}
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "#e57373",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.8rem",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              }}
            >
              Close
            </button>

            <div style={{ marginBottom: "10px", marginTop: "30px" }}>
              <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
                Edge Details
              </h3>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Label:
              </label>
              <input
                type="text"
                value={selectedEdge.label || ""}
                onChange={(e) => {
                  const updatedEdges = edges.map((edge) =>
                    edge.id === selectedEdge.id
                      ? { ...edge, label: e.target.value }
                      : edge
                  );
                  setEdges(updatedEdges);
                  setSelectedEdge({ ...selectedEdge, label: e.target.value });
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                  fontSize: "1rem",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Color:
              </label>
              <input
                type="color"
                value={selectedEdge.style?.stroke || "#000000"}
                onChange={(e) => {
                  const updatedEdges = edges.map((edge) =>
                    edge.id === selectedEdge.id
                      ? {
                          ...edge,
                          style: { ...edge.style, stroke: e.target.value },
                        }
                      : edge
                  );
                  setEdges(updatedEdges);
                  setSelectedEdge({
                    ...selectedEdge,
                    style: { ...selectedEdge.style, stroke: e.target.value },
                  });
                }}
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Type:
              </label>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={() => {
                    const updatedEdges = edges.map((edge) =>
                      edge.id === selectedEdge.id
                        ? {
                            ...edge,
                            style: { strokeDasharray: undefined },
                            markerEnd: undefined,
                          }
                        : edge
                    );
                    setEdges(updatedEdges);
                    setSelectedEdge({
                      ...selectedEdge,
                      style: { strokeDasharray: undefined },
                      markerEnd: undefined,
                    });
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    backgroundColor: selectedEdge.style?.strokeDasharray
                      ? "#fff"
                      : "#4caf50",
                    color: selectedEdge.style?.strokeDasharray
                      ? "#333"
                      : "#fff",
                  }}
                >
                  Solid
                  <svg height="10" width="50">
                    <line
                      x1="0"
                      y1="5"
                      x2="50"
                      y2="5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    const updatedEdges = edges.map((edge) =>
                      edge.id === selectedEdge.id
                        ? {
                            ...edge,
                            style: { strokeDasharray: "5,5" },
                            markerEnd: undefined,
                          }
                        : edge
                    );
                    setEdges(updatedEdges);
                    setSelectedEdge({
                      ...selectedEdge,
                      style: { strokeDasharray: "5,5" },
                      markerEnd: undefined,
                    });
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    backgroundColor:
                      selectedEdge.style?.strokeDasharray === "5,5"
                        ? "#4caf50"
                        : "#fff",
                    color:
                      selectedEdge.style?.strokeDasharray === "5,5"
                        ? "#fff"
                        : "#333",
                  }}
                >
                  Dashed
                  <svg height="10" width="50">
                    <line
                      x1="0"
                      y1="5"
                      x2="50"
                      y2="5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    const updatedEdges = edges.map((edge) =>
                      edge.id === selectedEdge.id
                        ? {
                            ...edge,
                            markerEnd: { type: "arrowclosed" },
                            style: { strokeDasharray: undefined },
                          }
                        : edge
                    );
                    setEdges(updatedEdges);
                    setSelectedEdge({
                      ...selectedEdge,
                      markerEnd: { type: "arrowclosed" },
                      style: { strokeDasharray: undefined },
                    });
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    backgroundColor: selectedEdge.markerEnd?.type
                      ? "#4caf50"
                      : "#fff",
                    color: selectedEdge.markerEnd?.type ? "#fff" : "#333",
                  }}
                >
                  Arrow
                  <svg height="10" width="50">
                    <line
                      x1="0"
                      y1="5"
                      x2="40"
                      y2="5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <polygon
                      points="40,0 50,5 40,10"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {contextMenu && (
          <ContextMenu
            position={contextMenu}
            onClick={() => addNode({ x: contextMenu.x, y: contextMenu.y })}
            onRename={() => selectedNode && onNodeDoubleClick(null, selectedNode)}
            onClose={closeContextMenu}
          />
        )}
      </div>

      {/* Right-side panel */}
      <div
        style={{
          zIndex: 1000,
          width: "20%",
          padding: "10px",
          right: "0",
          top: "0",
          position: "absolute",
          background: "#f4f4f4",
          height: "100%",
          overflowY: "auto",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ color: "#2C5F2D" }}>Learning Space Details</h3>

        <div style={{ marginBottom: "10px", textAlign: "center" }}>
          <button
            onClick={refreshPage}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            Home Page
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ fontWeight: "bold", fontSize: "1rem", color: "#4caf50" }}
          >
            Learning Space Name:
          </label>
          <input
            type="text"
            value={mapName}
            readOnly
            onBlur={() => updateSupabase(nodes, edges)}
            placeholder="Enter Learning Space name"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              backgroundColor: "#f9f9f9",
              fontSize: "1rem",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ fontWeight: "bold", fontSize: "1rem", color: "#4caf50" }}
          >
            Learning Space Description:
          </label>
          <textarea
            value={mapDescription}
            onChange={(e) => setMapDescription(e.target.value)}
            onBlur={() => updateSupabase(nodes, edges)}
            placeholder="Enter Learning Space description"
            style={{
              width: "100%",
              height: "80px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              backgroundColor: "#f9f9f9",
              fontSize: "1rem",
              resize: "none",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ fontWeight: "bold", fontSize: "1rem", color: "#4caf50" }}
          >
            Learning Space ID:
          </label>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              fontSize: "1rem",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            {mapId}
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ fontWeight: "bold", fontSize: "1rem", color: "#4caf50" }}
          >
            Last Edited:
          </label>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              fontSize: "1rem",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            {lastEdited}
          </div>
        </div>

        {currentUserId && (
          <ParticipantBox mapId={mapId} currentUserId={currentUserId} />
        )}
      </div>

      {/* Node details side panel */}
      <div
        ref={nodeDetailsPanelRef}
        style={{
          zIndex: 2000,
          position: "absolute",
          top: 0,
          right: 0,
          width: "250px",
          padding: "20px",
          background: "white",
          height: "100%",
          overflowY: "auto",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          borderRadius: "8px 0 0 8px",
          transform: showNodeDetails ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        <button
          onClick={() => setShowNodeDetails(false)}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "#e57373",
            color: "white",
            border: "none",
            borderRadius: "20px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "0.8rem",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
          }}
        >
          Close
        </button>

        {selectedNode && (
          <div>
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#4caf50",
                color: "white",
                borderRadius: "12px",
                marginTop: "30px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                Node Details
              </h3>
              <p
                style={{
                  padding: "10px",
                  margin: "10px 0 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {nodeCreators[selectedNode.creator]?.username ||
                  "Unknown Creator"}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Node Name:
              </label>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {selectedNode.data.label}
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Creator:
              </label>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {nodeCreators[selectedNode.creator]?.username || "Unknown"}
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Creation Date:
              </label>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {selectedNode.creationTimestamp
                  ? new Date(selectedNode.creationTimestamp).toLocaleString()
                  : "Unknown"}
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Border Color:
              </label>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Notes:
              </label>
              <textarea
                ref={noteInputRef}
                value={nodeNotes[selectedNode.id] || ""}
                onChange={handleNoteChange}
                onBlur={handleNoteBlur}
                placeholder="Add a note for this node"
                style={{
                  width: "100%",
                  height: "60px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                  resize: "none",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#4caf50",
                  fontSize: "1rem",
                }}
              >
                Link:
              </label>
              <input
                type="text"
                value={nodeData[selectedNode.id]?.link || ""}
                onChange={(e) => handleLinkChange(e.target.value)}
                placeholder="Add a link"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                }}
              />
            </div>

            {nodeData[selectedNode.id]?.link && (
              <div style={{ marginTop: "15px" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    color: "#4caf50",
                    fontSize: "1rem",
                  }}
                >
                  View Link:
                </label>
                <a
                  href={nodeData[selectedNode.id].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    marginTop: "10px",
                    color: "#4caf50",
                    textDecoration: "underline",
                    wordBreak: "break-word",
                    fontSize: "1rem",
                  }}
                >
                  {nodeData[selectedNode.id].link}
                </a>
              </div>
            )}
          </div>
        )}
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
