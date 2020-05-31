import React, {useEffect, useState} from "react";
import Popup from "reactjs-popup";
import styled from "styled-components";
import axios from 'axios';

const TitleContainer = styled.div`
    font-size: 14px;
    font-weight: bolder;
    margin: 10px 20px;
    color: #000000;
`;

const ErrorContainer = styled.div`
    font-size: 10px;
    font-weight: bolder;
    margin: 10px 20px;
    color: #FF0000;
`;

const InputContainer = styled.input`
  width: 500px;
  height: 20px;
  margin: 5px 20px;
  display: flex;
`;

const SubmitContainer = styled.button`
  font-size: 14px;
  font-weight: bolder;
  height: 30px;
  background: #d1dffa;
  display: flex;
  margin: 10px auto;
  border-radius: 5px
`;

const AddModal = props => {
  const {isVisible, handleIsVisible, updateColIdx, updateMode, updateItem, tasklist, state} = props
  const [ formObj, setFormObj ] = useState()
  const [ errorMsg, setErrMsg ] = useState()

  useEffect (() => {
    if(updateMode){
      loadUpdateItem();
    }
  }, [updateMode])

  const handleOnClose = () => {
    setErrMsg("")
    handleIsVisible(false)
  }

  const handleOnchange = event => {
    let content = formObj?formObj:{}
    content[event.target.name] = event.target.value
    setFormObj(content)
  }

  const loadUpdateItem = () => {
    let content = formObj?formObj:{}
    content["title"] = updateItem.title;
    content["desc"] = updateItem.content;
    setFormObj(content)
  }

  const handleOnSubmit = () => {
    console.log(tasklist)
    console.log(updateItem)
    console.log(formObj)
    if(!formObj || formObj.title === undefined){
        setErrMsg("Please key in Task Title!")
        return;
    }

    let duplicate = false;
    let updateMode = false;
    if(updateItem == undefined){
      for(let task of tasklist){
        if(task.title === formObj.title){
          duplicate = true;
          break;
        }
      }
    }
    else{
      updateMode = true
      console.log(tasklist)
      console.log(updateItem)
      for(let task of tasklist){
        if(task.title === formObj.title && updateItem.id != task.id){
          duplicate = true;
          break;
        }
      }
    }


    if(duplicate){
      setErrMsg("Duplicated Task!")
    }
    else if(updateMode){
      let data = {
        "title": formObj.title,
        "desc": formObj.desc?formObj.desc:"",
        "col_id": state[updateColIdx].col_title,
        "pos": state[updateColIdx].position,
      }
      let addTaskObs = axios.put("http://localhost:3000/tasks/"+updateItem.id, data)
      addTaskObs.then(addRes=>{
        if(addRes.status === 200 || addRes.status === 201){
          handleOnClose()
        }
      })
    }
    else{
      let addTaskObs =axios.post("http://localhost:3000/tasks",{
        id: new Date().getTime(),
        "title": formObj.title,
        "desc": formObj.desc?formObj.desc:"",
        "col_id": state[updateColIdx].col_title,
        "pos": state[updateColIdx].col_tasks.length,
      })
      addTaskObs.then(addRes=>{
        if(addRes.status === 200 || addRes.status === 201){
          handleOnClose()
        }
      })
      
    }
  }
  return (
    <Popup 
      open={isVisible}
      position="right center"
      closeOnEscape={false}
      onClose={()=> handleOnClose()}
    >
      <div>
          Trello Contents
          <label>
            <TitleContainer>Title:</TitleContainer>
            <InputContainer 
              type="text" 
              name="title" 
              defaultValue={updateItem && updateItem.title ? updateItem.title : undefined}
              onChange={e=> handleOnchange(e)} 
            />
          </label>
          <label>
            <TitleContainer>Description:</TitleContainer>
            <InputContainer 
              type="text" 
              name="desc" 
              defaultValue={updateItem && updateItem.content ? updateItem.content : undefined}
              onChange={e=> handleOnchange(e)}
            />
          </label>
          <label>
          <ErrorContainer>{errorMsg}</ErrorContainer>
          </label>
          <SubmitContainer value="Submit" onClick={() => handleOnSubmit()}>Submit</SubmitContainer>
      </div>
    </Popup>
    )
}

export default AddModal