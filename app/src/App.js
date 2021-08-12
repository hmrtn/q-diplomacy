import logo from "./logo.svg";
import "./App.css";
import "./styles/output.css";
import "./styles/custom.css";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useRouteMatch,
} from "react-router-dom";
import Header from "./components/header";
import Home from "./views/Home";

function App() {
  return (
    <Router>
      <Header />
      <div>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          {/* <Route path="/about">
            <About />
          </Route>
          <Route path="/nft/:id">
            <NftDetail />
          </Route> */}
        </Switch>
      </div>
    </Router>
  );
}

export default App;
