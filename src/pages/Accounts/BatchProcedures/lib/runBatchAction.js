import Swal from "sweetalert2";

// Generic maker-checker action runner, genericized from
// CustomerAccountDetailDrawer.jsx's closure-bound `runAction` — this version
// takes its success/error hooks as params instead of capturing outer state,
// since it's shared across 9 batch types' Audit/Authorize/Submit actions.
export async function runBatchAction(fn, { confirmTitle, confirmText, successMessage, onSuccess }) {
  if (confirmTitle) {
    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Confirm",
    });
    if (!result.isConfirmed) return;
  }

  try {
    await fn();
    Swal.fire("Success", successMessage, "success");
    onSuccess?.();
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}
