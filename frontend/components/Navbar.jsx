import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 30px",
      backgroundColor: "#1a252f",
      color: "white",
      marginBottom: "20px",
      fontFamily: "sans-serif"
    }}>
      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#3498db" }}>
        Shrushti NGO MIS
      </div>
      <div style={{ display: "flex", gap: "20px" }}>
        <NavLink 
          to="/" 
          style={({ isActive }) => ({
            color: isActive ? "#3498db" : "#bdc3c7",
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            fontSize: "15px"
          })}
        >
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/projects" 
          end
          style={({ isActive }) => ({
            color: isActive ? "#3498db" : "#bdc3c7",
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            fontSize: "15px"
          })}
        >
          Projects List
        </NavLink>

        <NavLink 
          to="/classify-projects" 
          style={({ isActive }) => ({
            color: isActive ? "#3498db" : "#bdc3c7",
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            fontSize: "15px"
          })}
        >
          Classify Queue
        </NavLink>

        <NavLink 
          to="/projects/add" 
          style={({ isActive }) => ({
            color: isActive ? "#3498db" : "#bdc3c7",
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            fontSize: "15px"
          })}
        >
          Add New Project
        </NavLink>

        <NavLink 
          to="/reports" 
          style={({ isActive }) => ({
            color: isActive ? "#3498db" : "#bdc3c7",
            textDecoration: "none",
            fontWeight: isActive ? "bold" : "normal",
            fontSize: "15px"
          })}
        >
          Reports & Export
        </NavLink>
      </div>
    </nav>
  );
}
