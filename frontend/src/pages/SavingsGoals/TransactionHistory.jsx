import {
  LuPiggyBank,
  LuWallet,
} from "react-icons/lu";

function TransactionHistory({
  transactions = [],
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-muted small mt-3">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="mt-4">

      <h6 className="fw-bold mb-3">
        Recent Activity
      </h6>

      <div className="d-flex flex-column gap-3">

        {transactions.map((transaction) => {

          const deposit =
            transaction.transaction_type === "deposit";

          return (
            <div
              key={transaction.id}
              className="d-flex justify-content-between align-items-center border-bottom pb-2"
            >

              <div className="d-flex align-items-center">

                {deposit ? (
                  <LuPiggyBank
                    className="text-success me-2"
                    size={20}
                  />
                ) : (
                  <LuWallet
                    className="text-danger me-2"
                    size={20}
                  />
                )}

                <div>

                  <div className="fw-semibold">
                    {transaction.note || "No note"}
                  </div>

                  <small className="text-muted">
                    {new Date(
                      transaction.created_at
                    ).toLocaleDateString()}
                  </small>

                </div>

              </div>

              <strong
                className={
                  deposit
                    ? "text-success"
                    : "text-danger"
                }
              >
                {deposit ? "+" : "-"}₹
                {Number(
                  transaction.transaction_amount
                ).toLocaleString()}
              </strong>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default TransactionHistory;