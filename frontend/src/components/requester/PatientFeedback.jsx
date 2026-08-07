import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, Heart } from 'lucide-react';

const PatientFeedback = ({ requestId, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      await fetch('/api/request/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId || 'req_unknown', donor_id: 'dnr_1', rating, comments })
      });
    } catch (e) {}

    setTimeout(() => {
      if (onSubmitted) onSubmitted();
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center mx-auto shadow-lg text-white">
          <Heart className="w-7 h-7 fill-white" />
        </div>
        <h2 className="text-xl font-bold text-white font-heading">Rate Donor & Share Feedback</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Your feedback helps reward reliable donors with higher priority scores and badges.
        </p>
      </div>

      {submitted ? (
        <div className="glass-panel p-6 rounded-2xl text-center text-emerald-400 space-y-2 border-emerald-500/40">
          <CheckCircle className="w-10 h-10 mx-auto" />
          <h3 className="text-lg font-bold text-white">Thank You for Your Feedback!</h3>
          <p className="text-xs text-slate-300">5 Stars recorded for Rahul Sharma (+50 Donor Points awarded).</p>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <label className="block text-xs font-semibold text-slate-300 mb-3">Overall Experience with Donor</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-amber-300 font-bold mt-2">{rating} out of 5 Stars</p>
            </div>

            <div className="form-group">
              <label>Comments & Words of Gratitude</label>
              <textarea
                rows={4}
                required
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Rahul arrived within 15 minutes! Very courteous and helpful."
                className="form-control"
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3 text-sm rounded-xl font-bold">
              Submit Donor Rating
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientFeedback;
