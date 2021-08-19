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
import { useEventListener } from "../hooks";
import { fromWei, toWei, toBN } from "web3-utils";

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
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [elecName, setElecName] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalFunds, setTotalFunds] = useState(0);
  const [remainTokens, setRemainTokens] = useState(0);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [canEndElection, setCanEndElection] = useState(false);
  const [isElectionActive, setIsElectionActive] = useState(false);

  const ballotCastEvent = useEventListener(readContracts, "Diplomacy", "BallotCast", localProvider, 1);
  const electionEndedEvent = useEventListener(readContracts, "Diplomacy", "ElectionEnded", localProvider, 1);

  const voting_columns = [
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

  const voted_columns = [
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
      title: "Current Score",
      dataIndex: "score",
      key: "score",
    },
    {
      title: "Payout Distribution",
      dataIndex: "payout",
      key: "payout",
      render: payout => {
        let ethToPay = fromWei(payout.toString(), "ether");
        ethToPay = parseFloat(ethToPay).toFixed(3);
        return <>{ethToPay} ETH</>;
      },
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
    bob: "0x6b88d83B4c7C5D0d6C7b503B82d54771A91E6f8f",
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

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("ballot cast event");
        updateView();
      }
    }
  }, [ballotCastEvent]);

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("Election ended event");
        updateView();
        // updatePayoutDistribution();
      }
    }
  }, [electionEndedEvent]);

  const init = async () => {
    updateView();
    // updatePayoutDistribution();
  };

  const updateView = async () => {
    const election = await readContracts.Diplomacy.getElectionById(id);
    const isCreator = election.admin == address;
    setCanEndElection(isCreator);
    setIsElectionActive(election.isActive);
    const funds = election.funds;
    const ethFund = fromWei(funds.toString(), "ether");
    setTotalFunds(ethFund);
    setElecName(election.name);
    console.log("setTotalVotes ", election.votes.toNumber());
    setTotalVotes(election.votes.toNumber());
    const hasVoted = await readContracts.Diplomacy.hasVoted(id, address);
    // console.log("hasVoted ", hasVoted);
    setAlreadyVoted(hasVoted);
    setRemainTokens(election.votes.toNumber());
    const electionCandidates = election.candidates;
    // console.log("electionCandidates ", electionCandidates);
    let data = [];
    let reverseWorkerMapping = reverseMapping(worker_mapping);
    let totalWei = toWei(funds.toString());
    for (let i = 0; i < electionCandidates.length; i++) {
      const name = reverseWorkerMapping[electionCandidates[i]];
      const addr = electionCandidates[i];
      const score = (await readContracts.Diplomacy.getElectionScore(id, addr)).toNumber();
      let tempTotalVotes = election.votes.toNumber();
      let weiToPay = 0;
      if (tempTotalVotes != 0) {
        const currScorePercent = (score / tempTotalVotes) * 100;
        weiToPay = (currScorePercent * totalWei) / 100;
      }
      data.push({ key: i, name: name, address: addr, n_votes: 0, score: score, payout: weiToPay });
    }
    setTableDataSrc(data);
  };

  const updatePayoutDistribution = async () => {
    const election = await readContracts.Diplomacy.getElectionById(id);
    const electionCandidates = election.candidates;
    let totalWei = toWei(totalFunds.toString());
    for (let i = 0; i < electionCandidates.length; i++) {
      const score = (await readContracts.Diplomacy.getElectionScore(id, electionCandidates[i])).toNumber();
      const currScorePercent = (score / totalVotes) * 100;
      totalWei = currScorePercent * totalWei;
      tableDataSrc[i].payout = totalWei;
    }
  };

  const castVotes = async () => {
    console.log("castVotes");
    const addrs = [];
    const votes = [];
    for (let i = 0; i < tableDataSrc.length; i++) {
      addrs.push(tableDataSrc[i].address);
      let percent_votes = (tableDataSrc[i].n_votes / totalVotes) * 100;
      percent_votes = Math.floor(percent_votes);
      console.log("percent_votes ", percent_votes);
      votes.push(tableDataSrc[i].n_votes);
    }
    const result = tx(writeContracts.Diplomacy.castBallot(id, addrs, votes), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
  };

  const endElection = async () => {
    console.log("endElection");
    const result = tx(writeContracts.Diplomacy.endElection(id), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
  };

  const payoutTokens = async () => {
    console.log("payoutTokens");
  };

  return (
    <>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
        <h2>Cast your votes for Election: {elecName}</h2>
        <Space split={<Divider type="vertical" />}>
          <h3>Total funds to distribute: {totalFunds} ETH</h3>
          <h3>Votes remaining: {remainTokens}</h3>
        </Space>
        <Divider />
        {isElectionActive && !alreadyVoted && <Table dataSource={tableDataSrc} columns={voting_columns} />}
        {(alreadyVoted || !isElectionActive) && <Table dataSource={tableDataSrc} columns={voted_columns} />}
        <Divider />
        {isElectionActive && !alreadyVoted && (
          <Button type="primary" size="large" style={{ margin: 4 }} onClick={() => castVotes()}>
            Cast Votes
          </Button>
        )}
        {alreadyVoted && <span>Votes Received! Thanks!</span>}
        <Divider />
        {canEndElection && isElectionActive && (
          <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => endElection()}>
            End Election
          </Button>
        )}
        {canEndElection && !isElectionActive && (
          <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => payoutTokens()}>
            Payout
          </Button>
        )}
      </div>
    </>
  );
}
