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
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [elecName, setElecName] = useState("");
  const [remainTokens, setRemainTokens] = useState(0);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "created_date",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "# Votes",
      dataIndex: "n_votes",
      key: "n_votes",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button type="primary" size="small" onClick={() => plusVote(index)}>
              +
            </Button>
            <Button type="primary" size="small" onClick={() => minusVote(index)}>
              -
            </Button>
          </Space>
        </>
      ),
    },
  ];
  function reverseMapping(obj) {
    var ret = {};
    for (var key in obj) {
      ret[obj[key]] = key;
    }
    return ret;
  }
  const worker_mapping = {
    swapp: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    hans: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    bliss: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    varun: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    ryan: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  };

  function minusVote(idx) {
    if (tableDataSrc[idx].n_votes > 0) {
      tableDataSrc[idx].n_votes = tableDataSrc[idx].n_votes - 1;
      setRemainTokens(remainTokens + 1);
    }
  }

  function plusVote(idx) {
    if (remainTokens > 0) {
      tableDataSrc[idx].n_votes = tableDataSrc[idx].n_votes + 1;
      setRemainTokens(remainTokens - 1);
    }
  }

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
      }
    }
  }, [readContracts]);

  const init = async () => {
    const election = await readContracts.Diplomacy.getElectionById(id);
    setElecName(election.name);
    const electionCandidates = await readContracts.Diplomacy.getElectionCandidates(id);
    setRemainTokens(10);
    console.log("electionCandidates ", electionCandidates);
    let reverseWorkerMapping = reverseMapping(worker_mapping);
    let data = [];
    for (let i = 0; i < electionCandidates.length; i++) {
      const name = reverseWorkerMapping[electionCandidates[i]];
      const addr = electionCandidates[i];
      data.push({ key: i, name: name, address: addr, n_votes: 0 });
    }
    setTableDataSrc(data);
  };

  function castVotes() {
    console.log("castVotes");
    const addrs = [];
    const votes = [];
    for (let i = 0; i < tableDataSrc.length; i++) {
      addrs.push(tableDataSrc[i].address);
      votes.push(tableDataSrc[i].n_votes);
    }
  }

  return (
    <>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
        <h2>Cast your votes for Election: {elecName}</h2>
        <h3>Votes remaining: {remainTokens}</h3>
        <Divider />
        <Table dataSource={tableDataSrc} columns={columns} />
        <Divider />
        <Button type="primary" size="large" style={{ margin: 4 }} onClick={() => castVotes()}>
          Cast Votes
        </Button>
        {/* <List
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
        /> */}
      </div>
    </>
  );
}
