import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaEdit, FaTrash, FaInfoCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import fixedassetsApi from "../../apis/fixedAssets/fixedassetsConfig";
import { FaMapLocationDot } from "react-icons/fa6";
import AddFixedAssets from "./AddFixedAssets";
import EditFixedAssets from "./EditFixedAssets";
import ViewFixedAssetDetails from "./ViewFixedAssetDetails";

export default function FixedAssetsSetup() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fixedassetsApi.get("/fixedasset");
      setAssets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      Swal.fire("Error", "Failed to fetch assets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fixedassetsApi.delete(`/fixedasset/${id}`);
          if (res.status !== 200) throw new Error("Failed to delete asset");

          Swal.fire("Deleted!", "Asset has been deleted.", "success");
          fetchAssets();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete asset.", "error");
        }
      }
    });
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setEditDrawerOpen(true);
  };

  const handleMoreInfo = (asset) => {
    setSelectedAsset(asset);
    setViewDrawerOpen(true);
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMapLocationDot className="text-white" /> Fixed Assets
        </h2>
        <Button
          onClick={() => setAddDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaMapLocationDot /> Add Asset
        </Button>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-8 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>No</span>
          <span>Serial Number</span>
          <span>Asset Name</span>
          <span>Created Date</span>
          <span>FASubClass</span>
          <span>Location</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-8 gap-4 bg-gray-50 p-6 rounded"
              >
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : assets.length > 0 ? (
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.Id}
                className="grid grid-cols-8 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-indigo-700">{asset.No}</span>
                <span className="font-medium">{asset.SerialNo}</span>
                <span className="font-medium">{asset.AssetName}</span>
                <span>{new Date(asset.CreatedDate).toLocaleDateString()}</span>
                <span>{asset.FASubClassDescription}</span>
                <span>{asset.LocationDescription}</span>

                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleMoreInfo(asset)}
                  >
                    <FaInfoCircle /> More Info
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleEdit(asset)}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(asset.Id)}
                  >
                    <FaTrash /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">No assets found.</p>
          </div>
        )}
      </div>

      <AddFixedAssets
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchAssets}
      />

      <EditFixedAssets
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedAsset(null);
        }}
        onSuccess={fetchAssets}
        asset={selectedAsset}
      />
      <ViewFixedAssetDetails
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
      />
    </div>
  );
}
