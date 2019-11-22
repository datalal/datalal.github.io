import React from "react"
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

function InstructionsModal (props) {
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Instructions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <ol>
                <li>Use a USB MIDI device or follow these instructions for <a target="_blank" rel="noopener noreferrer" href="https://help.ableton.com/hc/en-us/articles/209774225-How-to-setup-a-virtual-MIDI-bus">setting up an IAC Driver / virtual Midi</a></li>
                <li>Use in well lit environment</li>
                <li>Wait for Camera to load</li>
                <li>Checking a send box will start receving data from hand tracking and sending midi signal </li>
                <li>Adjust CTRL value to get hand tracking value in between 0 - 127 or desired range</li> 
                <li>Use confidence range to adjust hand detection confidence</li> 
                <li>Have fun!</li> 
            </ol>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  export default InstructionsModal