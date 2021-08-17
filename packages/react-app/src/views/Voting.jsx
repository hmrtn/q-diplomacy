import { useParams } from "react-router-dom";

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
  return <>Voting {id}</>;
}
