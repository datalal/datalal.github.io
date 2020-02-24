import React from 'react';
import './App.css';
import * as handTrack from 'handtrackjs';
import * as webmidi from "webmidi";
import 'bootstrap/dist/css/bootstrap.min.css';
import InstructionsModal from "./components/InstructionsModal"

import taichi from './taichi_2.mp4';
import mime from './mime.mp4';
import waving from './waving.mp4';
    
const CheckBox = props => (
  <input type="checkbox" name={props.name} {...props} />
)

const ConfidenceRange = props => (
  <input type="range" min="0" max="1" value="1" step="0.05" {...props} />
)

const AttRange = props => (
  <input type="range" min="1" max="600" step="1" {...props} />
)

const MidiSelect = (props) => (
  <select name="midiInput" {...props} >
    {props.midioutputs.map((output, key) => <option key={key}>{output.name}</option>)}
 </select>
)

const HandSelect = (props) => (
  <select name="handSelect" {...props} >
    <option key={1} value={1}>1</option>
    <option key={2} value={2}>2</option>
 </select>
)

const VideoSourceSelect = (props) => (
  <select name="videoSourceSelect" {...props} >
    <option key={1} value="camera"> camera</option>
    <option key={2} defaultValue value="file">Video File</option>
 </select>
)

const HiddenVideoPlayer = (props) => 
(
  props.videoSource === "camera" ?
  <video
    key={props.videoSource}
    controls
    autoPlay 
    width="640"
    height="640"
    className="videobox canvasboxHidden" 
    id="myvideo"
    muted
  /> :
  <video
    key={props.videoSource}
    autoPlay
    width="640"
    height="640"
    className="videobox canvasboxHidden" 
    id="myvideo"
    loop
    muted
> 
  <source src={ props.videoSource === "camera" ? null : props.src} type="video/mp4" />
</video>
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
      midiDevices: [],
      maxNumBoxes:1,
      showModal: false,
      setModalShow: false,
      videoSource: "file",
      videoSourceFile: mime,
      video: null,
      canvas: null,
      context: null,
    }


    this.modelParams = {
      flipHorizontal: true,   // flip e.g for video  
      maxNumBoxes: this.state.numberOfHands,        // maximum number of boxes to detect
      iouThreshold: 0.5,      // ioU threshold for non-max suppression
      scoreThreshold: this.state.confidenceRange,    // confidence threshold for predictions.
    }
  }

  handleChange = event => {
    console.log('handleBox1X');
    if(event.target.type === "checkbox") {
      this.setState({[event.target.name]: !this.state[event.target.name]})

    } else {
        this.setState({[event.target.name]: parseInt(event.target.value)})
    }
  }

  handleModelChange = event => {
    console.log(event.target.value)

    this.setState({
      [event.target.name]: event.target.value
    }, () => {
      this.modelParams = {
        ...this.modelParams, 
        maxNumBoxes: this.state.maxNumBoxes,
        scoreThreshold: parseFloat(this.state.confidenceRange)
      }
      console.log(this.modelParams)
      handTrack.load(this.modelParams).then(lmodel => {
        console.log("modelREloaded")
        // detect objects in the image.
        this.model = lmodel
      })
    })
    // this.modelParams = {...this.modelParams, maxNumBoxes: this.state.numberOfHands}
    // Reload the model.
  }

  handleVideoSourceChange = event => {
    console.log("handleVideoSourceChange")
    console.log(event.target.value)
    this.setState({
      videoSource: event.target.value
    })
    console.log(this.state.videoSource)
    if (event.target.value === "file") {
      console.log("aboutto.stopVideo()")
      this.stopVideo()
    }
    this.loadTheModel()
  }

  handleVideoFile = file => {
    // console.log(file)
    const fr = new FileReader();
    let imageURI = null
    fr.onload = (ev) => {
      imageURI = ev.target.result
      this.setState({
        videoSourceFile: imageURI
      }, () => {
        // console.log(this.state.videoSourceFile)
        this.state.video.load()

      })
      // console.log(imageURI)
    }

    fr.readAsDataURL(file)

    // console.log(fr)
    // console.log(fr.results)
    // console.log(imageURI)
    this.newVideo = fr.result
    // console.log(this.newVideo)
  }

  startVideo = () => {
    const video = this.state.video
    const canvas = this.state.canvas
    const context = this.state.context
    let isVideo = true
    this.runDetection(video, canvas, context, isVideo)
    handTrack.startVideo(video).then(function (status) {
        console.log("video started", status);
        if (status) {
            isVideo = true
        } else {
        }
    });

  }

  stopVideo = () => {
    const video = this.state.video
    console.log("this.stopVideo()")
    handTrack.stopVideo(video).then(function (status) {
        console.log("video cam stopped", status);
    });
    // this.loadTheModel()
  }

  runDetection = () => {
    const video = this.state.video
    const canvas = this.state.canvas
    const context = this.state.context
    const isVideo = true

    // console.log(video)
    // console.log("RUN DETECTION STATE", this.state)
    // console.log("2. FILE RUN DECTECTION")
    // console.log(video)
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

          const box_2_y = (box2Ypos /  this.state.box_2_y_att).toFixed();
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
          const box_2_area = (box2size /  this.state.box_2_area_att).toFixed();
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
        requestAnimationFrame(() => {this.runDetection(video, canvas, context, isVideo) })
    });
  }

  loadTheModel = () => {
    const video = this.state.video
    const canvas = this.state.canvas
    const context = this.state.context
    const isVideo = true
    console.log(video)
    handTrack.load(this.modelParams).then(lmodel => {
      // detect objects in the image.
      this.model = lmodel
      console.log('loaded model');
      console.log(" load the model video: ", this.state.video)
      if (this.state.videoSource === "file"){
        console.log(this.state.video)
        let newVideo = this.state.video
        console.log(newVideo)
        newVideo.load()
        newVideo.play()
        console.log(newVideo)

        // this.state.video.load()
        // this.state.video.play()
        console.log(newVideo.readyState)
        console.log(newVideo.currentSrc)
        console.log(newVideo.error)
        console.log("loadTheModel", this.state.videoSource)
        console.log("1. FILE LOAD THE MODEL RUNDETECTION")
        this.runDetection(video, canvas, context, isVideo)
      } else {
        this.startVideo(video, canvas, context, isVideo);
      }
    });
  }

  componentDidMount(){
    console.log("COMPONENT DID MOUNT")
    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    
    let isVideo = true;

    this.setState({
      video: video,
      canvas: canvas,
      context: context,
    })

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

    this.loadTheModel()
    // this.startVideo(video, isVideo)
  }

  setModalShow = showModal => {
    this.setState({
      showModal: showModal,
      setShowModal: showModal
    })
  }

  render () {
    console.log(this.state)
    return(
    <div className="App">
    <div className="headerSpace">therimidi.js </div>
    <div className="instructions" onClick={() => this.setModalShow(true)}>Instructions </div>
    <InstructionsModal
        show={this.state.showModal}
        onHide={() => this.setModalShow(false)}
    />
    <div className="midiSelect">  Select Midi Device: {this.midiOutputs && <MidiSelect midioutputs={this.midiOutputs ? this.midiOutputs : null}/>}</div> 
      <div className={this.midiOutput ? "midiConnected" : "midiDisconnected"}> {this.midiOutput ? this.midiOutput.state : null} </div>
      <div className="controls">
        <div className={this.state.send_box_1_x ? "paramControlon" : "paramControloff"}>
            <CheckBox
              name="send_box_1_x" 
              className="checkbox"
              checked={this.state.send_box_1_x}
              onChange={this.handleChange}
              togglevalue='send_box_1_x'
            />
            <span> Box 1 X: {this.state.box_1_x_val} / {this.state.box_1_x_att} = {this.state.box_1_x} </span>
          <div className="attSliderContainer"> 
            ctrl: <AttRange 
              name="box_1_x_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_1_x_att}
            />
          </div>
        </div>
        <div className={this.state.send_box_1_y ? "paramControlon" : "paramControloff"}>
            <CheckBox 
              name="send_box_1_y" 
              className="checkbox"
              checked={this.state.send_box_1_y}
              onChange={this.handleChange}
              togglevalue='send_box_1_y'
            />
            <span>Box 1 Y: {this.state.box_1_y_val} / {this.state.box_1_y_att} = {this.state.box_1_y} </span>
            <div className="attSliderContainer"> 
              ctrl: <AttRange 
              name="box_1_y_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              id="confidenceRange"
              value={this.state.box_1_y_att}
            />
          </div>
          </div>
          <div className={this.state.send_box_1_area ? "paramControlon" : "paramControloff"}>
              <CheckBox 
                name="send_box_1_area" 
                className="checkbox"
                checked={this.state.send_box_1_area}
                onChange={this.handleChange}
                togglevalue='send_box_1_area'
              />
              <span>Box 1 Size:  {this.state.box_1_area_val} / {this.state.box_1_area_att} = {this.state.box_1_area} </span>
          <div className="attSliderContainer"> 
            ctrl: <AttRange 
              name="box_1_area_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              id="confidenceRange"
              value={this.state.box_1_area_att}
            />
          </div>
        </div>
        <div className={this.state.send_box_2_x ? "paramControlon" : "paramControloff"}>
            <CheckBox 
              name="send_box_2_x" 
              className="checkbox"
              checked={this.state.send_box_2_x}
              onChange={this.handleChange}
              togglevalue='send_box_2_x'
            />
            <span>Box 2 X: {this.state.box_2_x_val} / {this.state.box_2_x_att} = {this.state.box_2_x} </span>
        <div className="attSliderContainer"> 
            ctrl: <AttRange 
              name="box_2_x_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_2_x_att}
            />
          </div>
        </div>
          <div className={this.state.send_box_2_y ? "paramControlon" : "paramControloff"}>
              <CheckBox 
                name="send_box_2_y" 
                className="checkbox"
                checked={this.state.send_box_2_y}
                onChange={this.handleChange}
              />
              <span>Box 2 Y: {this.state.box_2_y_val} / {this.state.box_2_y_att} = {this.state.box_2_y} </span>
          <div className="attSliderContainer"> 
            ctrl: <AttRange 
              name="box_2_y_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_2_y_att}
            />
          </div>
        </div>
        <div className={this.state.send_box_2_area ? "paramControlon" : "paramControloff"}>
            <CheckBox 
              name="send_box_2_area" 
              className="checkbox"
              checked={this.state.send_box_2_area}
              onChange={this.handleChange}
            />
            <span>Box 2 Size: {this.state.box_2_area_val} / {this.state.box_2_area_att} =  {this.state.box_2_area} </span>
            <div className="attSliderContainer"> 
            ctrl: <AttRange 
              name="box_2_area_att" 
              onChange={this.handleChange}
              className="confidenceRange"
              value={this.state.box_2_area_att}
            />
            </div>
          </div>
          <br />
        <div className="confidenceRangeContainer">
          <div className="midiSelect">  Video Source: {<VideoSourceSelect videosource={this.state.videoSource} name="videoSourceSelect" onChange={this.handleVideoSourceChange}/>}</div> 
          { this.state.videoSource === "file" &&
            <input type="file"
              id="file"
              accept=".mp4"
              onChange={event => this.handleVideoFile(event.target.files[0])}
            />
          }
          <div className="midiSelect">  Number of Hands: {<HandSelect name="maxNumBoxes" onChange={this.handleModelChange}/>}</div> 
            Confidence Range: {this.state.confidenceRange}
          <br />
          <ConfidenceRange 
            name="confidenceRange" 
            onChange={this.handleModelChange}
            className="paramControlon"
            id="confidenceRange"
            value={this.state.confidenceRange}
          />
        </div>
        </div>
        <br />
        <br />
        <br />
          <canvas id="canvas" className="border canvasbox"></canvas>
          <br />
          <HiddenVideoPlayer src={this.state.videoSourceFile} videoSource={this.state.videoSource}/>
      </div>
    )
  }
}

export default App;
