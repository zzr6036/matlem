import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { AiOutlineDelete } from "react-icons/ai";
import axios from 'axios';
import AddModal from "./AddModal"

const AddNewItemBtn = styled.button`
    width: 120px;
    margin: 0px 65px 12px 65px;
    font-size: 40px;
    font-weight: bold;
    border: none;
    background: none;
    line-height: 40px;
`;

const TrelloBoardContainer = styled.div`
    margin: 10px;
    font-size: 18px;
    text-align: center;
    font-weight: bolder;
`;

const ColumnGroup = styled.div`
    margin-top: 10px;
    display: flex;
    background: #f0f8ff;
`;

const DraggableContainer = styled(Draggable)`
    background: #a4c0f4;
`

const TitleContainer = styled.div`
    color: #fff;
    font-size: 14px;
    font-weight: bolder;
    margin: 10px auto;
`;

const ContentContainer = styled.div`
    color: #fff;
    font-size: 12px;
    font-weight: bolder;
`;

const ColumnTitleContainer = styled.div`
    font-size: 16px;
    font-weight: bolder;
    margin: 10px;
`;

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  let i = 0
  let postData = []
  for(let task of result){
    task.position = i;
    i += 1;
    postData.push( 
    {
        "id": task.id,
        "postInfo":{
            "pos": i,
            "title": task.title,
            "desc": task.content,
            "col_id": task.col_id,
        }

    })
  }
  for(let postD of postData){
    let updatePosition = axios.put("http://localhost:3000/tasks/"+postD.id, postD.postInfo)
    updatePosition.then((resPos)=>{
        if(resPos.status == 200 || resPos.status == 201){
          console.log("updated")
        }
    })
  }

  return result;
};

// Moves an item from one list to another list.
const move = (source, destination, droppableSource, droppableDestination, destinationColId) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
//   console.log(destinationState)
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

//   console.log(result)
  let i = 0
  let postData = []
  for(let task of result[droppableDestination.droppableId]){
    task.position = i;
    i += 1;
    postData.push( 
    {
        "id": task.id,
        "postInfo":{
            "pos": i,
            "title": task.title,
            "desc": task.content,
            "col_id": destinationColId,
        }

    })
    task.col_id = destinationColId
  }
  for(let postD of postData){
    let updatePosition = axios.put("http://localhost:3000/tasks/"+postD.id, postD.postInfo)
    updatePosition.then((resPos)=>{
        if(resPos.status == 200 || resPos.status == 201){
          console.log("updated")
        }
    })
  }
  return result;
};
const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? "#8db0f2" : "#6495ed",

  // styles we need to apply on draggables
  ...draggableStyle
});
const getListStyle = isDraggingOver => ({
  marginLeft: "10px",
  background: isDraggingOver ? "#99ffcc" : "#d1dffa",
  padding: grid,
  width: 250
});

const Board = props => {
  const [state, setState] = useState([]);
  const [columnIdxMap, setColumnIndexMap] = useState({})
  const [columnMap, setColumnMap] = useState({})
  const [tasklist, setTaskList] = useState({})
  const [isAddVisible, setIsAddVisible] = useState(false)
  const [updateColIdx, setUpdateColIdx]= useState()
  const [updateItem, setUpdateItem] = useState()
  const [updateMode, setUpdateMode] = useState(false)


  useEffect(() => {
      load()
  }, [isAddVisible])

  const load = () => {
    let mapIndex = {}
    let mapColumn = {}
    let columnInfo = []
    let columnsPromise = axios.get(`http://localhost:3000/task_columns`)
    columnsPromise.then(columnRes=>{
        if(columnRes.status === 200){
            let columnList = columnRes.data;
            if(columnList){
                for(let col of columnList){
                    columnInfo.push({
                        id: col.id,
                        col_title: col.title,
                        col_tasks: []
                    })
                    mapIndex[col.title] = columnInfo.length - 1;
                    mapColumn[columnInfo.length - 1] = col.title
                    setColumnIndexMap(mapIndex)
                    setColumnMap(mapColumn)
                }

                let tasksPromise = axios.get(`http://localhost:3000/tasks`);
                tasksPromise.then(taskListRes=>{
                    if(taskListRes.status === 200){
                        let taskList = taskListRes.data;
                        for(let task of taskList){
                            columnInfo[mapIndex[task.col_id]].col_tasks.push({
                                id: `${task.id}`,
                                title: `${task.title}`, 
                                content: `${task.desc}`,
                                position: `${task.pos}`,
                                col_id: `${task.col_id}`,
                            })
                        }

                        for(let colInfo of columnInfo){
                            colInfo.col_tasks = colInfo.col_tasks.sort((a,b)=>{
                                return (+a.position<+b.position)?-1:1;
                            })
                        }
                        setTaskList(taskList)
                        setState(columnInfo)
                    }
                })
            }
        }

    })
}

  function onDragEnd(result) {
    const { source, destination } = result;
    // dropped outside the list
    if (!destination) {
      return;
    }
    const sInd = +source.droppableId;
    const dInd = +destination.droppableId;

    if (sInd === dInd) {
      const items = reorder(state[sInd].col_tasks, source.index, destination.index);
      const newState = [...state];
      newState[sInd].col_tasks = items;
      setState(newState);
    } else {
      const result = move(state[sInd].col_tasks, state[dInd].col_tasks, source, destination, state[dInd].col_title);
      const newState = [...state];
      newState[sInd].col_tasks = result[sInd];
      newState[dInd].col_tasks = result[dInd];
      setState(newState);
    //   setState(newState.filter(group => group.length));
    }
  }

  const handleAddItem = idx => {
      setUpdateMode(false)
      setIsAddVisible(true)
      setUpdateColIdx(idx)
      setUpdateItem()
  }

  const handleEditCard = (columnIdx, item) => {
    setUpdateMode(true)
    setIsAddVisible(true)
    setUpdateColIdx(columnIdx)
    setUpdateItem(item)
  }

  const handleDeleteItem = (columnIdx, item) => {
    let deleteObs = axios.delete("http://localhost:3000/tasks/"+item.id)
    deleteObs.then((deleteRes)=>{
        if(deleteRes.status === 200 || deleteRes.status === 201){
          load()
        }
      })
  }

  return (
    <div>
        <AddModal 
            isVisible={isAddVisible}
            handleIsVisible={setIsAddVisible}
            updateColIdx={updateColIdx}
            updateItem={updateItem}
            tasklist={tasklist}
            columnMap={columnMap}
            state={state}
            updateMode={updateMode}
        />
        <TrelloBoardContainer>Trello Board</TrelloBoardContainer>
      <ColumnGroup>
        <DragDropContext onDragEnd={onDragEnd}>
          {state.map((el, ind) => (
            <div key={ind}>
                <ColumnTitleContainer>{el.col_title}</ColumnTitleContainer>
                <Droppable key={ind} droppableId={`${ind}`}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}
                        {...provided.droppableProps}
                    >
                    <AddNewItemBtn
                        onClick={()=>handleAddItem(ind)}
                    >
                    +
                    </AddNewItemBtn>
                    {el.col_tasks.map((item, index) => (
                        <DraggableContainer
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                        >
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style
                                    )}
                                >
                                    <TitleContainer onClick={() => handleEditCard(ind, item)}>{item.title}</TitleContainer>
                                <div
                                    style={{
                                    display: "flex",
                                    justifyContent: "space-between"
                                    }}
                                >
                                    <ContentContainer onClick={() => handleEditCard(ind, item)}>{item.content}</ContentContainer>
                                    <AiOutlineDelete 
                                        style={{color: '#fff'}}
                                        onClick={() => handleDeleteItem(ind, item)}
                                    />
                                </div>
                                </div>
                            )}
                        </DraggableContainer>
                    ))}
                    {provided.placeholder}
                    </div>
                )}
                </Droppable>
            </div>
          ))}
        </DragDropContext>
      </ColumnGroup>
    </div>
  );
}

export default Board