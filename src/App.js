import React from 'react';
import './App.css';
import * as handTrack from 'handtrackjs';
import * as webmidi from "webmidi";
// import taichi from './taichi_2.mp4';
// import mime from './mime.mp4';
    
// let modelParams = {
//   flipHorizontal: true,   // flip e.g for video  
//   maxNumBoxes: 2,        // maximum number of boxes to detect
//   iouThreshold: 0.5,      // ioU threshold for non-max suppression
//   scoreThreshold: 0.55,    // confidence threshold for predictions.
// }

const CheckBox = props => (
  <input type="checkbox" name={props.name} {...props} />
)

const ConfidenceRange = props => (
  <input type="range" min="0" max="1" value="1" step="0.05" {...props} />
)

const AttRange = props => (
  <input type="range" min="1" max="600" step="1" {...props} />
)

const TextInput = props => (
  <input type="number" {...props} />
)

const MidiSelect = (props) => (
  <select name="midiInput" {...props} >
    {props.midioutputs.map((output, key) => <option key={key}>{output.name}</option>)}
 </select>
)

class App extends React.Component {
  constructor(props) {
    super(props)
    this.model = null;

    this.state = { 
      send_box_1_y: false,
      send_box_1_x: false,
      send_box_1_area: false,
      send_box_2_y: false,
      send_box_2_x: false,
      send_box_2_area: false,
      box_1_y_val: 0,
      box_1_x_val: 0,
      box_1_area_val: 0,
      box_2_y_val: 0,
      box_2_x_val: 0,
      box_2_area_val: 0,
      box_1_y_att: 4,
      box_1_x_att: 9,
      box_1_area_att: 450,
      box_2_y_att: 4,
      box_2_x_att: 9,
      box_2_area_att: 450,
      box_1_y_calc: 0,
      box_1_x_calc: 0,
      box_1_area_calc: 0,
      box_2_y_calc: 0,
      box_2_x_calc: 0,
      box_2_area_calc: 0,
      confidenceRange: 0.6,
      midiDevices: []
    }


    this.modelParams = {
      flipHorizontal: true,   // flip e.g for video  
      maxNumBoxes: 2,        // maximum number of boxes to detect
      iouThreshold: 0.5,      // ioU threshold for non-max suppression
      scoreThreshold: this.state.confidenceRange,    // confidence threshold for predictions.
    }

    // Load the model.
    handTrack.load(this.modelParams).then(lmodel => {
      // detect objects in the image.
      this.model = lmodel
    });
    
  }

  handleChange = event => {
    console.log('handleBox1X');
    if(event.target.type === "checkbox") {
      this.setState({[event.target.name]: !this.state[event.target.name]})

    } else {
        this.setState({[event.target.name]: parseInt(event.target.value)})
    }
  }

  handleConfidenceRange = event => {
    this.setState({
      confidenceRange: parseFloat(event.target.value)
    })
    this.modelParams = {...this.modelParams, scoreThreshold: parseFloat(this.state.confidenceRange)}
    console.log(this.modelParams)
    // Load the model.
    handTrack.load(this.modelParams).then(lmodel => {
      console.log("modelREloaded")
      // detect objects in the image.
      this.model = lmodel
    });
  }

  componentDidMount(){
    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    
    let isVideo = false;
    
    webmidi.enable(function (err) {
      if (err) {
        console.log("WebMidi could not be enabled.", err);
      } else {
        console.log("WebMidi enabled!");
        this.midiOutput = webmidi.outputs[0];
        this.midiOutputs = webmidi.outputs;
        console.log(this.midiOutputs[0].id);
        if (webmidi.outputs[0]) {
          this.setState({
            midiDevices: this.midiOutputs,
          });
        }
      }
    }.bind(this));

    // // Load the model.
    // handTrack.load(modelParams).then(lmodel => {
    //   // detect objects in the image.
    //   model = lmodel
    // });

    const startVideo = () => {
      // isVideo = true
      // runDetection()

      handTrack.startVideo(video).then(function (status) {
          console.log("video started", status);
          if (status) {
              isVideo = true
              runDetection()
          } else {
          }
      });
    }
    
    const runDetection = () => {
      this.model.detect(video).then(predictions => {
          // console.log("Predictions: ", predictions);
          this.model.renderPredictions(predictions, canvas, context, video);
          if ((this.state.send_box_1_x) && predictions[0]) {
        
            let box1midvalX = predictions[0].bbox[0] + (predictions[0].bbox[2] / 2)
            let box1_x_raw = box1midvalX.toFixed()
            let box1Xpos = document.body.clientWidth * (box1midvalX / video.width)
            const box_1_x = (box1Xpos / this.state.box_1_x_att).toFixed()
            const box_1_x_val = box_1_x > 127 ? 127 : box_1_x

            this.setState({
              box_1_x: box_1_x_val,
              box_1_x_val: box1_x_raw,
            })

            if (this.midiOutput && this.state.send_box_1_x) {
              // console.log('box_1_x: ', box_1_x_val)
              this.midiOutput.sendControlChange(1, box_1_x_val, "all");
            }
          }

          if ((this.state.send_box_1_y) && predictions[0]) {
        
            let box1midvalY = predictions[0].bbox[1] + (predictions[0].bbox[3] / 2)
            let box1_y_raw = box1midvalY.toFixed()
            let box1Ypos = document.body.clientHeight * (box1midvalY / video.height)
            
            const box_1_y = (box1Ypos /  this.state.box_1_y_att).toFixed()

            const box_1_y_val = box_1_y > 127 ? 127 : box_1_y



            this.setState({
              box_1_y: box_1_y_val,
              box_1_y_val: box1_y_raw,
            })

            if (this.midiOutput && this.state.send_box_1_y) {
              // console.log('box_1_y: ', box_1_y_val)
              this.midiOutput.sendControlChange(2,box_1_y_val, "all");
            }
          }

          if ((this.state.send_box_1_area) && predictions[0]) {
        
            let box1midvalX = predictions[0].bbox[0] + (predictions[0].bbox[2] / 2)
            let box1size = predictions[0].bbox[2] * predictions[0].bbox[3]
            let box1_area_raw = box1size.toFixed()
            const box_1_area = ((box1_area_raw / 10) /  this.state.box_1_area_att).toFixed()
            const box_1_area_val = box_1_area > 127 ? 127 : box_1_area



            this.setState({
              box_1_area: box_1_area_val,
              box_1_area_val: box1_area_raw,
            })

            if (this.midiOutput && this.state.send_box_1_area) {
              // console.log('box_1_area: ', box_1_area_val)
              this.midiOutput.sendControlChange(3, box_1_area_val, "all");
            }
          }

          if ((this.state.send_box_2_x) && predictions[1]) {
            let box2midvalX = predictions[1].bbox[0] + (predictions[1].bbox[2] / 2)

            let box2Xpos = document.body.clientWidth * (box2midvalX / video.width)

            const box_2_x = (box2Xpos /  this.state.box_2_x_att).toFixed();
            let box1_x_raw = box2midvalX.toFixed()
            const box_2_x_val =  box_2_x > 127 ? 127 : box_2_x

            this.setState({
              box_2_x: box_2_x_val,
              box_2_x_val: box1_x_raw,
            })

            if (this.midiOutput && this.state.send_box_2_x) {
              // console.log('box_2_x: ', box_2_x_val)
              this.midiOutput.sendControlChange(4, box_2_x_val, "all");
            }
          }

          if ((this.state.send_box_2_y) && predictions[1]) {
            let box2midvalY = predictions[1].bbox[1] + (predictions[1].bbox[3] / 2)
            let box2Ypos = document.body.clientHeight * (box2midvalY / video.height)

            const box_2_y = (box2Ypos /  this.state.box_1_y_att).toFixed();
            let box1_y_raw = box2midvalY.toFixed()
            const box_2_y_val =  box_2_y > 127 ? 127 : box_2_y

            this.setState({
              box_2_y: box_2_y_val,
              box_2_y_val: box1_y_raw,
            })

            if (this.midiOutput && this.state.send_box_2_y) {
              // console.log('box_2_y: ', box_2_y_val)
              this.midiOutput.sendControlChange(5, box_2_y_val, "all");
            }
          }

          if ((this.state.send_box_2_area) && predictions[1]) {
            let box2size = predictions[1].bbox[2] * predictions[1].bbox[3]
            const box_2_area = (box2size /  this.state.box_1_area_att).toFixed();
            let box1_area_raw = box2size.toFixed()
            const box_2_area_val = box_2_area > 127 ? 127 : box_2_area

            this.setState({
              box_2_area: box_2_area_val,
              box_2_area_val: box1_area_raw,
            })

            if (this.midiOutput && this.state.send_box_2_area) {
              // console.log('box_2_area: ', box_2_area_val)
              this.midiOutput.sendControlChange(6, box_2_area_val, "all");
            }
          }

          if (isVideo) {
              requestAnimationFrame(runDetection);
          }
      });
    }

    // Load the model.
    handTrack.load(this.modelParams).then(lmodel => {
      // detect objects in the image.
      this.model = lmodel
      console.log('loaded model');
      // runDetection()

      startVideo();
    });
  }

  render () {
    return(
    <div className="App">
    <div className="headerSpace">therimidi.js </div>
    <div className="midiSelect">  Select Midi Device: {this.midiOutputs && <MidiSelect midioutputs={this.midiOutputs ? this.midiOutputs : null}/>}</div> 
      <div className={this.midiOutput ? "midiConnected" : "midiDisconnected"}> {this.midiOutput ? this.midiOutput.state : null} </div>
      <div className="controls">
        <div className={this.state.send_box_1_x ? "paramControlon" : "paramControloff"}>
          <label>
            <CheckBox
              name="send_box_1_x" 
              className="checkbox"
              checked={this.state.send_box_1_x}
              onChange={this.handleChange}
              togglevalue='send_box_1_x'
            />
            <span>
                Box 1 X: 
                <span className="boxVal"> 
                  {this.state.box_1_x_val} 
                </span> 
                / <TextInput className={this.state.send_box_1_x ? "attInputOn" : "attInputOff"} value={this.state.box_1_x_att} /> = {this.state.box_1_x} 
              </span>
          </label>
          <div className="attSliderContainer"> 
            Att: <AttRange 
              name="box_1_x_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_1_x_att}
            />
          </div>
        </div>
        <div className={this.state.send_box_1_y ? "paramControlon" : "paramControloff"}>
          <label>
            <CheckBox 
              name="send_box_1_y" 
              className="checkbox"
              checked={this.state.send_box_1_y}
              onChange={this.handleChange}
            />
            <span>Box 1 Y: <span className="boxVal"> {this.state.box_1_y_val}  </span> / <TextInput className={this.state.send_box_1_y ? "attInputOn" : "attInputOff"} value={this.state.box_1_y_att} /> = {this.state.box_1_y} </span>
            </label>
            <div className="attSliderContainer"> 
              Att: <AttRange 
              name="box_1_y_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              id="confidenceRange"
              value={this.state.box_1_y_att}
            />
          </div>
          </div>
          <div className={this.state.send_box_1_area ? "paramControlon" : "paramControloff"}>
            <label>
              <CheckBox 
                name="send_box_1_area" 
                className="checkbox"
                checked={this.state.send_box_1_area}
                onChange={this.handleChange}
              />
              <span>Box 1 Size: <span className="boxVal">  {this.state.box_1_area_val} </span> / <TextInput className={this.state.send_box_1_area ? "attInputOn" : "attInputOff"}  value={this.state.box_1_area_att} /> = {this.state.box_1_area} </span>
            </label>
          <div className="attSliderContainer"> 
            Att: <AttRange 
              name="box_1_area_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              id="confidenceRange"
              value={this.state.box_1_area_att}
            />
          </div>
        </div>
        <div className={this.state.send_box_2_x ? "paramControlon" : "paramControloff"}>
          <label>
            <CheckBox 
              name="send_box_2_x" 
              className="checkbox"
              checked={this.state.send_box_2_x}
              onChange={this.handleChange}
            />
            <span>Box 2 X: <span className="boxVal">  {this.state.box_2_x_val}  </span> / <TextInput className={this.state.send_box_2_x ? "attInputOn" : "attInputOff"} value={this.state.box_2_x_att}/> = {this.state.box_2_x} </span>
          </label>
        <div className="attSliderContainer"> 
            Att: <AttRange 
              name="box_2_x_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_2_x_att}
            />
          </div>
        </div>
          <div className={this.state.send_box_2_y ? "paramControlon" : "paramControloff"}>
            <label>
              <CheckBox 
                name="send_box_2_y" 
                className="checkbox"
                checked={this.state.send_box_2_y}
                onChange={this.handleChange}
              />
              <span>Box 2 Y: <span className="boxVal">  {this.state.box_2_y_val} </span> / <TextInput className={this.state.send_box_2_y ? "attInputOn" : "attInputOff"} value={this.state.box_2_y_att}/> = {this.state.box_2_y} </span>
            </label>
          <div className="attSliderContainer"> 
            Att: <AttRange 
              name="box_2_y_att" 
              onChange={this.handleBox2YAtt}
              className="confidenceRange"
              value={this.state.box_2_y_att}
            />
          </div>
        </div>
        <div className={this.state.send_box_2_area ? "paramControlon" : "paramControloff"}>
          <label>
            <CheckBox 
              name="send_box_2_area" 
              className="checkbox"
              checked={this.state.send_box_2_area}
              onChange={this.handleChange}
            />
            <span>Box 2 Size: <span className="boxVal">  {this.state.box_2_area_val}  </span> / <TextInput className={this.state.send_box_2_area ? "attInputOn" : "attInputOff"} value={this.state.box_2_area_att} /> =  {this.state.box_2_area} </span>
            </label>
            <div className="attSliderContainer"> 
            Att: <AttRange 
              name="box_2_area_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_2_area_att}
            />
            </div>
          </div>
          <br />
        <div className="confidenceRangeContainer">
            Confidence Range: {this.state.confidenceRange}
          <br />
          <ConfidenceRange 
            name="confidenceRange" 
            onChange={this.handleConfidenceRange}
            className="paramControlon"
            id="confidenceRange"
            value={this.state.confidenceRange}
          />
        </div>
        </div>
        <br />
          <canvas id="canvas" className="border canvasbox"></canvas>
          <br />
          <video
            controls
            autoPlay 
            width="640"
            height="640"
            className="videobox canvasboxHidden" 
            id="myvideo"
          />
            {/* <source src={mime} type="video/mp4" /> */}
          {/* </video> */}
      </div>
    )
  }
}

export default App;
