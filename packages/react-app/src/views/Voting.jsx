import { PageHeader } from "antd";
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
import { useEventListener, useOnBlock } from "../hooks";
import { fromWei, toWei, toBN } from "web3-utils";
import { BigNumber } from "ethers";
import { CodeSandboxSquareFilled } from "@ant-design/icons";

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

  const [electionWeisToPay, setElectionWeisToPay] = useState([]);
  const [electionAddressesToPay, setElectionAddressesToPay] = useState([]);

  //   useOnBlock(localProvider, () => {
  //     console.log(`⛓ A new localProvider block is here: ${localProvider._lastBlockNumber}`);
  //   });

  const ballotCastEvent = useEventListener(readContracts, "Diplomacy", "BallotCast", localProvider, 1);
  const electionEndedEvent = useEventListener(readContracts, "Diplomacy", "ElectionEnded", localProvider, 1);
  const electionPayoutEvent = useEventListener(readContracts, "Diplomacy", "ElectionPaid", localProvider, 1);

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
            <Button type="default" size="small" onClick={() => plusVote(index)}>
              ➕
            </Button>
            <Button type="default" size="small" onClick={() => minusVote(index)}>
              ➖
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
    acc_1: "0x76c48E1F02774C40372a3497620D946136136172",
    acc_2: "0x01684C57AE8a4226271068210Ce1cCED865a5AfC",
    acc_3: "0xf5De4337Ac5332aF11BffbeC45D950bDDBc1493F",
    acc_4: "0x4E53E14de4e264AC2C3fF501ed3Bd6c4Ad63B9A1",
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
    console.log("ballotCastEvent ", ballotCastEvent.length);
    if (ballotCastEvent && ballotCastEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        updateView();
      }
    }
  }, [ballotCastEvent]);

  useEffect(() => {
    if (electionEndedEvent && electionEndedEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("Election ended event");
        updateView();
        // updatePayoutDistribution();
      }
    }
  }, [electionEndedEvent]);

  useEffect(() => {
    if (electionPayoutEvent && electionPayoutEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        // Stuff
        updateView();
      }
    }
  }, [electionPayoutEvent]);

  const init = async () => {
    updateView();
    // updatePayoutDistribution();
  };

  //

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
    setAlreadyVoted(hasVoted);
    if (!hasVoted) {
      setRemainTokens(election.votes.toNumber());
    }
    const electionCandidates = election.candidates;
    // console.log("electionCandidates ", electionCandidates);
    let data = [];

    let reverseWorkerMapping = reverseMapping(worker_mapping);

    for (let i = 0; i < electionCandidates.length; i++) {
      const name = reverseWorkerMapping[electionCandidates[i]];
      const addr = electionCandidates[i];
      const scores = await readContracts.Diplomacy.getElectionScores(id, addr);
      let scoresSum =
        scores.length > 0
          ? scores
              .map(Number)
              .reduce((a, b) => {
                return a + b;
              })
              .toFixed(4)
          : "0";
      let tempTotalVotes = election.votes.toNumber();
      let weiToPay = 0;
      if (tempTotalVotes != 0) {
        weiToPay = electionWeisToPay.length > 0 ? electionWeisToPay[i].toString() : toWei("0", "ether");
      }
      data.push({ key: i, name: name, address: addr, n_votes: 0, score: scoresSum, payout: weiToPay });
    }
    setTableDataSrc(data);

    calculatePayout();
  };

  const castVotes = async () => {
    console.log("castVotes");
    const election = await readContracts.Diplomacy.getElectionById(id);
    const adrs = election.candidates; // hmm...
    console.log(adrs);
    const votes = [];
    for (let i = 0; i < tableDataSrc.length; i++) {
      votes.push(Math.sqrt(tableDataSrc[i].n_votes).toString());
    }

    const result = tx(writeContracts.Diplomacy.castBallot(id, adrs, votes), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
    // updateView();
  };

  const calculatePayout = async () => {
    const election = await readContracts.Diplomacy.getElectionById(id);
    // console.log({ election });

    let totalScoreSumSqr = 0;

    const payoutInfo = [];

    for (let i = 0; i < election.candidates.length; i++) {
      // Get scores arr for each candidate
      let scores = await readContracts.Diplomacy.getElectionScores(id, election.candidates[i]);
      let scoresSumSqr = Math.pow(
        scores.map(Number).reduce((a, b) => {
          return a + b;
        }),
        2,
      ); //reduce((a, b) => {Number(a) + Number(b)});
      totalScoreSumSqr += scoresSumSqr;
      payoutInfo.push({ address: election.candidates[i], scoresSumSqr: scoresSumSqr });
    }
    const payoutRatio = [];
    for (let i = 0; i < payoutInfo.length; i++) {
      payoutRatio.push({ address: payoutInfo[i].address, ratio: payoutInfo[i].scoresSumSqr / totalScoreSumSqr });
    }
    // console.log({ payoutRatio });
    const ethFunds = fromWei(election.funds.toString(), "ether");
    let electionAdrToPay = payoutRatio.map(d => {
      return d.address;
    });
    let electionWeiToPay = payoutRatio
      .map(d => {
        return d.ratio;
      })
      .map(c => {
        return c * Number(ethFunds);
      })
      .map(b => {
        return toWei(b.toFixed(18));
      });
    // console.log("electionWeiToPay ", { electionWeiToPay });

    setElectionAddressesToPay(electionAdrToPay);
    setElectionWeisToPay(electionWeiToPay);

    if (tableDataSrc) {
      electionWeiToPay.forEach((w, i) => {
        tableDataSrc[i].payout = w;
      });
    }
  };

  const endElection = async () => {
    calculatePayout();
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
    // // console.log(electionWeiToPay)
    // // console.log(electionAddressToPay)

    const election = await readContracts.Diplomacy.getElectionById(id);
    // console.log({ election });

    // let totalScoreSumSqr = 0;

    // const payoutInfo = [];

    // for (let i = 0; i < election.candidates.length; i++) {
    //   // Get scores arr for each candidate
    //   let scores = await readContracts.Diplomacy.getElectionScores(id, election.candidates[i]);
    //   let scoresSumSqr = Math.pow(
    //     scores.map(Number).reduce((a, b) => {
    //       return a + b;
    //     }),
    //     2,
    //   ); //reduce((a, b) => {Number(a) + Number(b)});
    //   totalScoreSumSqr += scoresSumSqr;
    //   payoutInfo.push({ address: election.candidates[i], scoresSumSqr: scoresSumSqr });
    // }

    // console.log({ payoutInfo });
    // const payoutRatio = [];
    // for (let i = 0; i < payoutInfo.length; i++) {
    //   payoutRatio.push({ address: payoutInfo[i].address, ratio: payoutInfo[i].scoresSumSqr / totalScoreSumSqr });
    // }
    // console.log({ payoutRatio });
    // const ethFunds = fromWei(election.funds.toString(), "ether");
    // let electionAdrToPay = payoutRatio.map(d => {
    //   return d.address;
    // });
    // let electionWeiToPay = payoutRatio
    //   .map(d => {
    //     return d.ratio;
    //   })
    //   .map(c => {
    //     return c * Number(ethFunds);
    //   })
    //   .map(b => {
    //     return toWei(b.toFixed(18));
    //   });
    // console.log({ electionWeiToPay });
    // console.log({ electionAdrToPay})
    // console.log(readContracts.Diplomacy)
    tx(
      writeContracts.Diplomacy.payoutElection(id, electionAddressesToPay, electionWeisToPay, { value: election.funds }),
    );
  };

  return (
    <>
      <div
        className="voting-view"
        style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}
      >
        <PageHeader
          ghost={false}
          onBack={() => window.history.back()}
          title={elecName}
          extra={[
            canEndElection && isElectionActive && (
              <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => endElection()}>
                End
              </Button>
            ),
            canEndElection && !isElectionActive && (
              <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => payoutTokens()}>
                💸 Payout
              </Button>
            ),
            isElectionActive && !alreadyVoted && (
              <Button type="primary" size="large" style={{ margin: 4 }} onClick={() => castVotes()}>
                🗳️ Vote
              </Button>
            ),
          ]}
        >
          <h2>Cast your votes for Election: {elecName}</h2>
          <Space split={<Divider type="vertical" />}>
            <h3>Total funds to distribute: {totalFunds} ETH</h3>
            <h3>Votes remaining: {remainTokens}</h3>
          </Space>
          <Divider />
          {isElectionActive && !alreadyVoted && <Table dataSource={tableDataSrc} columns={voting_columns} />}
          {(alreadyVoted || !isElectionActive) && <Table dataSource={tableDataSrc} columns={voted_columns} />}
          <Divider />
          {/* {isElectionActive && !alreadyVoted && (
            <Button type="primary" size="large" style={{ margin: 4 }} onClick={() => castVotes()}>
              Vote
            </Button>
          )} */}
          {alreadyVoted && <h3>Votes Received! Thanks!</h3>}
          {/* <Divider />
          {canEndElection && isElectionActive && (
            <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => endElection()}>
              End
            </Button>
          )}
          {canEndElection && !isElectionActive && (
            <Button type="danger" size="large" style={{ margin: 4 }} onClick={() => payoutTokens()}>
              Payout
            </Button>
          )} */}
        </PageHeader>
      </div>
    </>
  );
}
