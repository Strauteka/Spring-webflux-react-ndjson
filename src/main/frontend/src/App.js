import "./App.css";
import React from "react";
import ndjsonStream from "can-ndjson-stream";

const State = {
  Init: "Init",
  Reading: "Reading",
  Closed: "Closed",
  Canceled: "Canceled",
  Canceling: "Canceling",
  ExecutingCancel: "Execute Cancel",
};

const link0 =
  "http://localhost:8080/ping?delayMsLow=0&delayMsHigh=5000&times=100";
const link1 =
  "http://localhost:8080/load?delayMsLow=20&delayMsHigh=100&times=101";

class PingPong extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      readingState: State.Init,
      readableStream: null,
      reader: null,
      isMounted: false,
    };
  }
  // fetchData = async () => {
  //   console.log("fetching data!");
  //   const response = await fetch("http://localhost:8080/ping", {
  //     method: "GET",
  //     Accept: "application/json",
  //   });

  //   const exampleReader = ndjsonStream(response.body).getReader();
  //   let result;
  //   while (!result || !result.done) {
  //     result = await exampleReader.read();
  //     console.log("fetching data!");
  //     if (result.value) {
  //       this.setState({ data: result.value });
  //     }
  //     console.log(result.done, result.value); //result.value is one line of your NDJSON data
  //   }
  // };

  customSetState = (state, callback) => {
    if (this.state.isMounted) {
      this.setState(state, callback);
    }
  };

  fetchData = () => {
    console.log("Request created!", this.props);

    fetch(this.props.link, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-ndjson",
        Accept: "application/x-ndjson",
      },
    })
      .then((response) => {
        return ndjsonStream(response.body); //ndjsonStream parses the response.body
      })
      .then((exampleStream) => {
        //retain access to the reader so that you can cancel it
        const reader = exampleStream.getReader();
        this.customSetState({
          readingState: State.Reading,
          readableStream: exampleStream,
          reader: reader,
        });

        reader.closed
          .then(() => {
            this.customSetState({ readingState: State.Closed });
          })
          .catch((e) => {
            this.customSetState({ readingState: State.Canceled });
          });

        this.dataRead(reader);
      })
      .catch((e) => console.log(e));
  };

  setCancel = () => {
    if (this.state.readingState === State.Reading) {
      this.customSetState({ readingState: State.Canceling });
    }
  };

  cancelStream = (nextReadCallback) => {
    if (
      this.state.readingState === State.Canceling &&
      this.state.readableStream &&
      this.state.reader
    ) {
      this.customSetState({ readingState: State.ExecutingCancel });
      this.state.reader.releaseLock();
      this.state.readableStream
        .cancel("Canceled")
        .then(() => console.log("Canceled promise!"));
    } else if (nextReadCallback) {
      nextReadCallback();
    }
  };

  dataRead = (reader) => {
    reader.read().then((result) => {
      if (result.value) {
        this.customSetState({ data: result.value });
      }

      if (result.done) {
        return;
      }

      this.cancelStream(() => this.dataRead(reader));
      // https://canjs.com/doc/can-ndjson-stream.html //errors!
      // exampleStream.getReader().read().then(read);
    });
  };

  injectPoisionPill = (callback) => {
    this.customSetState(
      { isMounted: false, readingState: State.Canceling },
      callback
    );
  };

  componentDidMount() {
    console.log("componentDidMount", this.props);
    this.setState({ isMounted: true });
    this.fetchData();
  }

  componentWillUnmount() {
    console.log("componentWillUnmount", this.props);
    //cant set state here!
  }

  profile = (data, state) => {
    return (
      <div>
        <span> Id:</span>
        <span> {data.id}</span>
        <span> Percent:</span>
        <span> {data.pong} % </span>
        <span> TimeMs:</span>
        <span> {data.timeMs}</span>
        <span> Reading State:</span>
        <span> {state}</span>
      </div>
    );
  };

  render() {
    return (
      <div>
        {this.state.data.id
          ? this.profile(this.state.data, this.state.readingState)
          : "No Data"}
      </div>
    );
  }
}

class PingPongWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { pingPong: null, pingPongRef: null };
  }

  componentDidMount() {
    this.initPingPong();
  }

  componentDidUpdate() {
    //forcing to replace objects
    //helps redraw pingPong object
    if (!this.state.pingPong) {
      this.initPingPong();
    }
  }

  setCancel = () => {
    this.state.pingPongRef.current.setCancel();
  };

  injectPoisionPill = (callback) => {
    this.state.pingPongRef.current.injectPoisionPill(callback);
  };

  initPingPong = () => {
    if (this.state.pingPongRef) {
      this.injectPoisionPill(() => {
        this.setState({ pingPong: null, pingPongRef: null });
      });
    } else {
      var localRef = React.createRef();
      var ping = <PingPong ref={localRef} link={this.props.link} />;
      this.setState({ pingPong: ping, pingPongRef: localRef });
    }
    return ping;
  };

  setExecute = () => {
    this.initPingPong();
  };

  render() {
    console.log("reloading!", this.state);
    return (
      <div>
        <div>{this.state.pingPong ? this.state.pingPong : ""}</div>
        <div id="container"></div>
        <div
          style={{
            height: "4vh",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <button onClick={this.setExecute}>press me!</button>
          <button onClick={this.setCancel}>Cancel!</button>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <div>
      <header className="App-header">
        <div>
          {Array(3)
            .fill()
            .map((notUsed, n) => (
              <PingPongWrapper key={n} link={link0} />
            ))}
          <br />
          {Array(3)
            .fill()
            .map((notUsed, n) => (
              <PingPongWrapper key={n} link={link1} />
            ))}
        </div>
      </header>
    </div>
  );
}

export default App;
