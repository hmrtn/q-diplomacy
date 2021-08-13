import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import SideBar from "../components/sidebar";
import { Iconly } from "react-iconly";

import Store from "../stores/store";
const store = Store.store;
const emitter = Store.emitter;
const dispatcher = Store.dispatcher;

export default function Voting() {
  let { id } = useParams();
  const [elecObj, setElecObj] = useState({});
  const [remainTokens, setRemainTokens] = useState(0);
  const [isBallotCast, setIsBallotCast] = useState(false);
  useEffect(() => {
    init();
  }, []);

  const testAddElection = () => {
    let election = {
      id: 0,
      name: "Build #1",
      creator: {
        name: "@owocki",
        role: "Developer",
      },
      status: {
        type: "Going on",
      },
      created_at: "6/4/2021",
      totalTokens: 10,
      workerList: [
        {
          name: "swapp",
          address: "0xDC25EF3F5B8A186998338A2ADA83795FBA2D695E",
          voteGiven: 0,
        },
        {
          name: "hans",
          address: "0xDC25233232F5B8A186998338A212334A2D695E",
          voteGiven: 0,
        },
        {
          name: "austin",
          address: "0xASC3232F5B8A186998338A21SCFFFD695E",
          voteGiven: 0,
        },
        {
          name: "ryan",
          address: "0xSCFDD8A186998338ASDSCCCC95E",
          voteGiven: 0,
        },
      ],
    };
    let elections = store.getStore().elections;
    let foundElection = elections.filter((e) => e.id == 0);
    if (foundElection.length == 0) {
      elections.push(election);
      //add to global store
      dispatcher.dispatch({
        type: "ADD_ELECTION",
        content: { election: election },
      });
    }
  };

  const init = async () => {
    testAddElection();
    updateView();
  };

  const updateView = () => {
    let elections = store.getElectionById(id);
    console.log("updateView ", elections);
    if (elections.length > 0) {
      setElecObj(elections[0]);
      setRemainTokens(elections[0].totalTokens);
    }
  };

  emitter.on("StoreUpdated", async () => {
    updateView();
  });

  const castBallot = async () => {
    console.log("castBallot");
    setIsBallotCast(true);
  };

  const minusVote = (e, i) => {
    if (e.voteGiven > 0) {
      e.voteGiven = e.voteGiven - 1;
      elecObj.workerList[i] = e;
      setElecObj((prevState) => ({
        ...prevState,
        workerList: elecObj.workerList,
      }));

      setRemainTokens(remainTokens + 1);
    }
  };

  const plusVote = (e, i) => {
    if (remainTokens > 0) {
      e.voteGiven = e.voteGiven + 1;
      elecObj.workerList[i] = e;
      setElecObj((prevState) => ({
        ...prevState,
        workerList: elecObj.workerList,
      }));

      setRemainTokens(remainTokens - 1);
    }
  };

  return (
    <>
      <div className="flex flex-row home" style={{ height: "90vh" }}>
        <SideBar />
        <main className="main flex flex-col flex-grow">
          <div className="main-content">
            <div className="w-full p-6">
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-xl p-4 font-bold">
                    Cast your votes for Election: {elecObj.name}
                  </span>
                  <span className="text-xl p-4 font-bold">
                    Votes Remaining: {remainTokens}
                  </span>
                </div>
                <table class="w-full">
                  <thead>
                    <tr class="text-md font-semibold tracking-wide text-left text-gray-900 bg-gray-100 uppercase border-b border-gray-600">
                      <th class="px-4 py-3 w-40">Worker Name</th>
                      <th class="px-4 py-3 w-80">
                        <span class="w-100 flex justify-center">
                          Give votes
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white">
                    {elecObj.workerList &&
                      elecObj.workerList.map((e, idx) => {
                        return (
                          <tr class="text-gray-700">
                            <td class="px-4 py-3 border">{e.name}</td>
                            <td class="px-4 py-3 border">
                              <div className="flex justify-center items-center">
                                {!isBallotCast && (
                                  <button className="border shadow w-8 items-center">
                                    <span
                                      className="text-black font-bold text-xl"
                                      onClick={() => minusVote(e, idx)}
                                    >
                                      -
                                    </span>
                                  </button>
                                )}
                                <span className="text-black font-bold text-xl p-2">
                                  {e.voteGiven}
                                </span>
                                {!isBallotCast && (
                                  <button className="border shadow w-8 items-center">
                                    <span
                                      className="text-black font-bold text-xl"
                                      onClick={() => plusVote(e, idx)}
                                    >
                                      +
                                    </span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                <div className="flex justify-between pt-4 m-2">
                  {!isBallotCast && (
                    <button
                      class="w-1/2 px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                      onClick={() => castBallot()}
                    >
                      Cast Ballot
                    </button>
                  )}
                  {isBallotCast && <span>Thank you for voting!</span>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
