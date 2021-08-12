import { Component } from "react";

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accountFmt: null,
    };
  }

  render() {
    return (
      <aside
        className="sidebar"
        style={{
          backgroundColor: "rgba(196, 196, 196,0.2)",
          width: "18%",
        }}
      >
        Sidebar
      </aside>
    );
  }
}

export default SideBar;
