import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  List,
  Typography,
  Progress,
  Slider,
  Spin,
  Switch,
  Table,
  Modal,
  Form,
  Checkbox,
  Select,
  Space,
} from "antd";

export default function Voting({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  let { id } = useParams();
  const [votesList, setVotesList] = useState([]);
  function castVotes() {
    console.log("castVotes");
  }
  return (
    <>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Cast your votes for Election: {}</h2>
        <h3>Votes remaining: {}</h3>
        <Divider />
        <List
          header={<div>Header</div>}
          footer={
            <Button type="primary" size="small" onClick={() => castVotes()}>
              Cast your Votes
            </Button>
          }
          bordered
          dataSource={votesList}
          renderItem={item => (
            <List.Item>
              <Typography.Text mark>[ITEM]</Typography.Text> {item}
            </List.Item>
          )}
        />
      </div>
    </>
  );
}
