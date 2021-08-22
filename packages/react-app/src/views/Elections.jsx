import { PageHeader, Carousel } from "antd";
import { toWei, fromWei } from "web3-utils";
import {
  Button,
  Divider,
  Input,
  InputNumber,
  List,
  Table,
  Modal,
  Form,
  Select,
  Space,
  Tag,
  Descriptions, 
} from "antd";
import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Address, Balance } from "../components";

import { useEventListener, useExchangePrice, } from "../hooks";
import AddressInput from "../components/AddressInput";
import EtherInput from "../components/EtherInput";

import { mainnetProvider, blockExplorer } from "../App";

import "../index.css"

const { Option } = Select;

export default function Elections({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const [numElections, setNumElections] = useState(0);
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [newElecName, setNewElecName] = useState("");
  const [newElecAllocatedVotes, setNewElecAllocatedVotes] = useState(10);
  const [newElecAllocatedFunds, setNewElecAllocatedFunds] = useState(1);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form] = Form.useForm();

  const route_history = useHistory();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  }

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };


  function viewElection(record) {
    route_history.push("/voting/" + record.key);
    // console.log("record ", record);
  }

  const endElection = async record => {
    const result = tx(writeContracts.Diplomacy.endElection(record.key), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
  };

  const electionCreatedEvent = useEventListener(readContracts, "Diplomacy", "ElectionCreated", localProvider, 1);
  const ballotCastEvent = useEventListener(readContracts, "Diplomacy", "BallotCast", localProvider, 1);

  const columns = [
    {
      title: "Created",
      dataIndex: "created_date",
      key: "created_date",
      width: 150,
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      align: "center",
    },
    {
      title: "Admin",
      dataIndex: "admin",
      key: "admin",
      width: 250,
      align: "center",
      render: admin => (
        <Address
          address={admin}
          fontSize="14pt"
          ensProvider={mainnetProvider}
          blockExplorer={blockExplorer}
        />
      ),
    },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      align: "center",
      render: roles => (
        roles.map(r => {
          //   let color = tag.length > 5 ? 'geekblue' : 'green';
          //   if (tag === 'loser') {
          //     color = 'volcano';
          //   }
          let color = "geekblue";
          if (r == "candidate") {
            color = "green";
          }
          return (
            <Tag color={color} key={r}>
              {r.toLowerCase()}
            </Tag>
          );
        })
      ),
    },
    {
      title: "Candidates",
      dataIndex: "n_workers",
      key: "n_workers",
      align: "center",
    },
    {
      title: "Voted",
      dataIndex: "n_voted",
      key: "n_voted",
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button type="default" size="small" shape="round" onClick={() => viewElection(record)}>
              View
            </Button>
          </Space>
        </>
      ),
    },
  ];
  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("readContracts");
        init();
      }
    }
  }, [readContracts]);

  useEffect(async () => {
    if (electionCreatedEvent && electionCreatedEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        const numElectionsNew = (await readContracts.Diplomacy.numElections()).toNumber();
        if (numElectionsNew > numElections) {
          //   console.log("electionCreatedEvent ", electionCreatedEvent);
          updateView();
          setIsCreating(false);
          // setNewElecAddr([]);
          setAddresses([]);
          setNewElecName("");
          form.resetFields();
        }
      }
    }
  }, [electionCreatedEvent]);

  useEffect(() => {
    if (ballotCastEvent && ballotCastEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("ballot cast event");
        updateView();
      }
    }
  }, [ballotCastEvent]);

  const init = async () => {
    console.log("contract loaded ", address);
    updateView();
  };

  const updateView = async () => {
    console.log("updateView ");
    const numElections = (await readContracts.Diplomacy.numElections()).toNumber();
    // console.log("numElections ", numElections);
    setNumElections(numElections);
    let data = [];
    let elections = [];
    for (let i = 0; i < numElections; i++) {
      const election = await readContracts.Diplomacy.getElectionById(i);
      //   console.log("election ", election);
      const name = election.name;
      const n_addr = election.n_addr.toNumber();
      const n_voted = (await readContracts.Diplomacy.getElectionVoted(i)).toNumber();
      let created_date = new Date(election.createdAt.toNumber() * 1000);
      created_date = created_date.toISOString().substring(0, 10);
      let admin = election.admin;
      let roles = [];
      const isAdmin = election.admin == address;
      if (isAdmin) {
        roles.push("admin");
      }
      const isCandidate = await readContracts.Diplomacy.canVote(i, address);
      if (isCandidate) {
        roles.push("candidate");
      }
      data.push({
        key: i,
        created_date: created_date,
        name: name,
        n_workers: n_addr,
        n_voted: n_voted,
        admin: admin,
        roles: roles,
      });
    }
    setTableDataSrc(data);
  };

  const createNewElection = () => {
    console.log("createNewElection");
    setIsModalVisible(true);
  };

  const onFinish = async () => {
    setIsCreating(true);
    const result = tx(
      writeContracts.Diplomacy.newElection(newElecName, newElecAllocatedFunds, newElecAllocatedVotes, addresses),
      update => {
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
        } else {
          console.log("update error ", update.status);
          setIsCreating(false);
        }
      },
    );
    // console.log("awaiting metamask/web3 confirm result...", result);
    // console.log(await result);
  };
  const slider = useRef(null);

  const [addresses, setAddresses] = useState([]);
  const [toAddress, setToAddress] = useState("");

  return (
    <>
      <Modal visible={isModalVisible} footer={false} onCancel={handleCancel}>
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: false }}
          onFinish={onFinish}
        >
          <Carousel ref={slider} afterChange={() => { }} speed="300" dots={false}>

            <div>
              <PageHeader
                ghost={false}
                title="Create A New Election"
                // subTitle="Election Options"
              />
              <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input election name!" }]}>
                <Input
                  size="large"
                  placeholder="Election Name"
                  onChange={e => {
                    e.target.value ? setNewElecName(e.target.value) : null;
                  }}
                />
              </Form.Item>
              <Form.Item name="funds" label="Funds" rules={[{ required: true, message: "Please input funds!" }]}>
                <EtherInput
                  // autofocus
                  price={price}
                  value={newElecAllocatedFunds}
                  placeholder="Enter amount"
                  onChange={value => {
                    // console.log(value)
                    // console.log(typeof value)
                    let weiValue = toWei(Number(value).toFixed(18).toString());
                    setNewElecAllocatedFunds(weiValue);
                    // console.log(weiValue)
                    // value ? setNewElecAllocatedFunds(toWei(value.toFixed(18))) : toWei("0", "ether");
                  }}
                />
              </Form.Item>
              <Form.Item
                name="votes"
                label="Vote Allocation"
                rules={[{ required: true, message: "Please input number of votes!" }]}
              >
                <InputNumber
                  size="large"
                  placeholder="1"
                  onChange={value => {
                    value ? setNewElecAllocatedVotes(value) : null;
                  }}
                />
              </Form.Item>

              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Divider>
                <Button type="primary" size="large" shape="round" onClick={() => { slider.current.next() }}>
                  Continue
                </Button>
                </Divider>
              </div>

            </div>

            <div>
              <PageHeader
                ghost={false}
                onBack={() => { slider.current.prev() }}
                title="Add Election Candidates"
                // subTitle="Add Election Candidates"
              />
              <Form.Item name="candidates" style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Space>
                  <AddressInput
                    ensProvider={mainnetProvider}
                    placeholder="Enter address"
                    value={toAddress}
                    onChange={setToAddress}
                  />
                  <Button type="default" size="large" onClick={() => {
                    addresses.push(toAddress)
                    setToAddress("");
                  }}>
                    + Add
                  </Button>
                </Space>

              </Form.Item>
              <List
                style={{ overflow: "auto", height: "200px" }}
                bordered
                dataSource={addresses}
                renderItem={(item, index) => (
                  <List.Item>
                    <div>
                      <Address address={item} ensProvider={mainnetProvider} fontSize="14pt" />
                      <Button
                        type="link"
                        onClick={async () => {
                          const updatedAddresses = [...addresses];
                          updatedAddresses.splice(index, 1);
                          setAddresses(updatedAddresses);
                        }}
                        size="medium"
                        style={{ marginLeft: "200px" }}
                      >
                        ❌
                      </Button>
                    </div>
                  </List.Item>
                )}
              />
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Divider>
                <Button type="primary" size="large" shape="round" onClick={() => { slider.current.next() }}>
                  Continue
                </Button>
                </Divider>
              </div>
            </div>

            <div>
              <PageHeader
                ghost={false}
                onBack={() => { slider.current.prev() }}
                title="Confirm Election Details"
                // subTitle="Review Election Details"
              />

              <Descriptions title="Election Details" column={1} size="small" bordered>
                <Descriptions.Item label="Name">{newElecName}</Descriptions.Item>
                <Descriptions.Item label="Allocated Funds (wei)">{newElecAllocatedFunds}</Descriptions.Item>
                <Descriptions.Item label="Votes/Candidate">{newElecAllocatedVotes}</Descriptions.Item>
                <Descriptions.Item label="Candidates">
                  <ul>{addresses.map(adr => {
                    return <li><Address address={adr} fontSize="14pt" /> </li>
                  })} 
                  </ul>
                </Descriptions.Item>
              </Descriptions>
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Divider>
                {!isCreating && (
                  <Button type="primary" size="large" shape="round" htmlType="submit" className="login-form-button">
                    Confirm Election
                  </Button>
                )}
                {isCreating && (
                  <Button type="primary" size="large" shape="round" loading>
                    Creating
                  </Button>
                )}
                </Divider>
              </div>
            </div>

          </Carousel>
        </Form>

      </Modal>

      <div className="elections-view" style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
        <PageHeader
          ghost={false}
          title="Elections"
          subTitle={`Count: ${numElections}`}
          extra={[
            <Button type="primary" size="large" shape="round" style={{ margin: 4 }} onClick={() => createNewElection()}>
              + Create Election
            </Button>,
          ]}
        />
        <Divider />
        <Table dataSource={tableDataSrc} columns={columns} />
      </div>
    </>
  );
}
