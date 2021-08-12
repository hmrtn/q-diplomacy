import { Iconly } from "react-iconly";
import React, { useState, useEffect, useSelector, useContext } from "react";
import Select from "react-select";
import SideBar from "../components/sidebar";

const Styles = {
  sortSelectedOption: {
    backgroundColor: "",
    border: "0px solid rgba(0, 0, 0, 0.25)",
    borderRadius: "10px",
    boxShadow: "8px 8px 4px rgba(0, 0, 0, 0.25)",
    padding: "10px",
    width: "100px",
  },
};

export default function Home() {
  const [electionList, setElectionList] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [addressList, setAddressList] = useState([]);
  const [nameAddressMapping, setNameAddressMapping] = useState({});
  const [electionName, setElectionName] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    let election = {
      name: "Build #1",
      creator: {
        name: "@owocki",
        role: "Developer",
      },
      status: {
        type: "Going on",
      },
      created_at: "6/4/2021",
    };
    let elections = [];
    elections.push(election);
    setElectionList(elections);

    let name_address_mapping = {};
    name_address_mapping["swapp"] =
      "0xDC25EF3F5B8A186998338A2ADA83795FBA2D695E";
    name_address_mapping["hans"] = "0xDC25233232F5B8A186998338A212334A2D695E";
    name_address_mapping["austin"] = "0xASC3232F5B8A186998338A21SCFFFD695E";
    name_address_mapping["ryan"] = "0xSCFDD8A186998338ASDSCCCC95E";
    setNameAddressMapping(name_address_mapping);

    let addressList = [];
    Object.keys(name_address_mapping).forEach((k) => {
      addressList.push({ value: k, label: k });
    });
    setAddressList(addressList);
  };

  const openNewElectionWindow = () => {
    console.log("openNewElectionWindow");
    toggleModal();
  };

  const closeModal = () => {
    console.log("closeModal");
    toggleModal();
  };

  const toggleModal = () => {
    const body = document.querySelector("body");
    const modal = document.querySelector(".modal");
    modal.classList.toggle("opacity-0");
    modal.classList.toggle("pointer-events-none");
    body.classList.toggle("modal-active");
  };

  const createElection = () => {
    if (electionName != "" && selectedOption != null) {
      let today = new Date(Date.now()).toLocaleDateString();
      let election = {
        name: electionName,
        creator: {
          name: "@owocki",
          role: "Developer",
        },
        status: {
          type: "Going on",
        },
        created_at: today,
        workerList: [],
      };
      setElectionList((oldArray) => [...oldArray, election]);
      toggleModal();
    }
  };

  const cancelForm = () => {
    setElectionName("");
    setSelectedOption(null);
    toggleModal();
  };

  return (
    <>
      <div className="flex flex-row home" style={{ height: "90vh" }}>
        <SideBar />
        <main className="main flex flex-col flex-grow">
          <header className="header bg-white shadow py-4 px-4">
            <div className="flex justify-between">
              {/* <div>
                <button
                  className="flex flex-row justify-between"
                  style={Styles.sortSelectedOption}
                >
                  Latest
                  <Iconly
                    name="CloseSquare"
                    set="two-tone"
                    primaryColor="black"
                    size="medium"
                  />
                </button>
              </div> */}
            </div>
          </header>
          <div className="main-content">
            <div className="w-full p-6">
              <div className="flex flex-col">
                <div className="flex justify-between pt-4 m-2">
                  <button
                    class="w-1/2 px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                    onClick={() => openNewElectionWindow()}
                  >
                    Create New
                  </button>
                </div>
                <table class="w-full">
                  <thead>
                    <tr class="text-md font-semibold tracking-wide text-left text-gray-900 bg-gray-100 uppercase border-b border-gray-600">
                      <th class="px-4 py-3">Election Name</th>
                      <th class="px-4 py-3">Creator</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Creation Date</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white">
                    {electionList.map((e, idx) => {
                      return (
                        <tr class="text-gray-700">
                          <td class="px-4 py-3 border">{e.name}</td>
                          <td class="px-4 py-3 text-ms font-semibold border">
                            <div class="flex items-center text-sm">
                              <div class="relative w-8 h-8 mr-3 rounded-full md:block">
                                <img
                                  class="object-cover w-full h-full rounded-full"
                                  src={e.creator.profile_src}
                                  alt=""
                                  loading="lazy"
                                />
                                <div
                                  class="absolute inset-0 rounded-full shadow-inner"
                                  aria-hidden="true"
                                ></div>
                              </div>
                              <div>
                                <p class="font-semibold text-black">
                                  {e.creator.name}
                                </p>
                                <p class="text-xs text-gray-600">
                                  {e.creator.role}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td class="px-4 py-3 text-xs border">
                            <span class="px-2 py-1 font-semibold leading-tight text-green-700 bg-green-100 rounded-sm">
                              {e.status.type}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-sm border">
                            {e.created_at}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal opacity-0 pointer-events-none fixed w-full h-full top-0 left-0 flex items-center justify-center">
            <div class="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>
            <div class="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
              <div class="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50">
                <svg
                  class="fill-current text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                >
                  <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
                </svg>
                <span class="text-sm">(Esc)</span>
              </div>
              <div
                class="modal-content py-4 text-left px-6 flex flex-col items-center justify-center"
                style={{ width: "100%" }}
              >
                <div class="flex justify-center">
                  <h3 class="font-bold text-xl">Create New Election</h3>
                </div>
                <div class="flex justify-between items-center pb-3">
                  <form
                    class="px-8 pt-6 bg-white rounded"
                    style={{ width: "420px" }}
                  >
                    <div class="mb-4">
                      <label
                        class="block mb-2 text-sm font-bold text-gray-700"
                        for="email"
                      >
                        Election Name
                      </label>
                      <input
                        class="w-full px-3 py-2 mb-3 text-sm leading-tight text-gray-700 border rounded shadow appearance-none hover:border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
                        id="email"
                        type="email"
                        placeholder="Name"
                        autoComplete="off"
                        onChange={(event) =>
                          setElectionName(event.target.value)
                        }
                      />
                    </div>
                    <div class="mb-4">
                      <label
                        class="block mb-2 text-sm font-bold text-gray-700"
                        for="email"
                      >
                        Add Workers
                      </label>
                      <Select
                        defaultValue={selectedOption}
                        onChange={setSelectedOption}
                        options={addressList}
                        isMulti="true"
                      />
                    </div>
                    <div
                      className="mb-4 border shadow overflow-y-scroll"
                      style={{ height: "100px" }}
                    >
                      <div class="bg-white rounded-md list-none  text-center ">
                        {selectedOption &&
                          selectedOption.map((o, idx) => {
                            return (
                              <li class="py-3 border-b-2">
                                <div class="flex justify-between">
                                  <p class="px-4 list-none  hover:text-indigo-600">
                                    {o.label}
                                  </p>
                                  <p class="px-4 text-sm text-grey-dark">
                                    {nameAddressMapping[o.value]}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                      </div>
                    </div>

                    <div class="mb-6 text-center">
                      <button
                        class="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                        type="button"
                        onClick={() => createElection()}
                      >
                        Create
                      </button>
                    </div>
                    <div class="mb-6 text-center">
                      <button
                        class="w-full px-4 py-2 font-bold text-white bg-red-500 rounded-full hover:bg-red-700 focus:outline-none focus:shadow-outline"
                        type="button"
                        onClick={() => cancelForm()}
                      >
                        Cancel
                      </button>
                    </div>
                    <hr class="mb-6 border-t" />
                    <div class="text-center">
                      <a
                        class="inline-block text-sm text-blue-500 align-baseline hover:text-blue-800"
                        href="#"
                      >
                        Help?
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
