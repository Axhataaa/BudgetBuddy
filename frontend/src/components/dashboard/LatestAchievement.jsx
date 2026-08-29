import { LuAward } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";
import { isPurchaseGoal } from "../../utils/goalType";

export default function LatestAchievement({ summary }) {
  const achievement = summary?.latest_achievement;
  const isPurchase = isPurchaseGoal(achievement);

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-4 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="font-display fs-5 fw-semibold mb-0 d-flex align-items-center">
          <LuAward className="text-warning me-2" size={22} />
          Latest Achievement
        </h2>
        {achievement && (
          <span className="badge bg-success-subtle text-success">Completed</span>
        )}
      </div>

      {!achievement ? (
        <div className="text-center py-4">
          <LuAward size={44} className="text-warning mb-3" />
          <h5 className="fw-semibold">No Achievements Yet</h5>
          <p className="text-muted-ink mb-0">
            Complete your first savings goal to unlock achievements.
          </p>
        </div>
      ) : (
        <div className="row align-items-center">
          <div className="col-md-8">
            <h3 className="fw-semibold mb-2">{achievement.goal_name}</h3>
            <p className="text-muted-ink mb-3">
              Congratulations! You achieved your goal of
              <strong> {achievement.goal_name}</strong>. 🎉
            </p>
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="small text-muted-ink">Target Amount</div>
                <div className="fw-semibold fs-5 font-currency">
                  {formatCurrency(achievement.target_amount)}
                </div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted-ink">
                  {isPurchase ? "Purchased On" : "Completed On"}
                </div>
                <div className="fw-semibold">
                  {new Date(achievement.purchase_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
            {achievement.purchase_note && (
              <div className="mt-4">
                <div className="small text-muted-ink mb-1">
                  {isPurchase ? "Purchase Note" : "Completion Note"}
                </div>
                <div className="small text-muted-ink fst-italic">
                  {achievement.purchase_note}
                </div>
              </div>
            )}
          </div>
          <div className="col-md-4 text-center">
            <LuAward size={72} className="text-warning mb-3" />
            <div className="fw-semibold">Achievement Unlocked</div>
            <div className="small text-muted-ink">Goal Completed Successfully</div>
          </div>
        </div>
      )}
    </div>
  );
}
