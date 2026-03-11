export default function Channel() {
  const { id } = useParams();
  return <div>Channel: #{id}</div>;
}