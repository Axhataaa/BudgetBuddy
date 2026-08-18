import api from "../api/axios";

export async function downloadUserDataExport() {
  const response = await api.get("users/me/export-data/", {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : "BudgetBuddy_Data_Export.zip";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
