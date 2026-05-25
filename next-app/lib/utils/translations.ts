export const POSITION_MAP: Record<string, string> = {
  GK: 'GK (Thủ môn)',
  CB: 'CB (Trung vệ)',
  LB: 'LB (Hậu vệ cánh trái)',
  RB: 'RB (Hậu vệ cánh phải)',
  DMF: 'DMF (Tiền vệ phòng ngự)',
  CMF: 'CMF (Tiền vệ trung tâm)',
  LMF: 'LMF (Tiền vệ cánh trái)',
  RMF: 'RMF (Tiền vệ cánh phải)',
  AMF: 'AMF (Tiền vệ tấn công)',
  LWF: 'LWF (Tiền đạo cánh trái)',
  RWF: 'RWF (Tiền đạo cánh phải)',
  SS: 'SS (Hộ công)',
  CF: 'CF (Tiền đạo cắm)'
};

export const SKILL_MAP: Record<string, string> = {
  'Double Touch': 'Double Touch (Gạt bóng hai chân)',
  'Scissors Feint': 'Scissors Feint (Đảo chân)',
  'Flip Flap': 'Flip Flap (Kỹ thuật Elastico)',
  'Marseille Turn': 'Marseille Turn (Xoay compa)',
  'Sombrero': 'Sombrero (Gẩy bóng qua đầu)',
  'Cut Behind & Turn': 'Cut Behind & Turn (Ngoặt bóng giật gót)',
  'Chop Turn': 'Chop Turn (Ngoặt bóng nhanh)',
  'Scotch Move': 'Scotch Move (Nhá bóng qua người)',
  'One-touch Pass': 'One-touch Pass (Chuyền một chạm)',
  'Through Passing': 'Through Passing (Chọc khe)',
  'Weighted Pass': 'Weighted Pass (Chuyền điểm rơi)',
  'Pinpoint Crossing': 'Pinpoint Crossing (Tạt bóng chính xác)',
  'Outside Curler': 'Outside Curler (Vẩy má ngoài)',
  'Rabona': 'Rabona (Đá chéo chân)',
  'No Look Pass': 'No Look Pass (Chuyền không nhìn)',
  'Low Lofted Pass': 'Low Lofted Pass (Chuyền bổng thấp)',
  'Heel Trick': 'Heel Trick (Đánh gót)',
  'Sole Control': 'Sole Control (Vê gầm giày)',
  'Long Range Shooting': 'Long Range Shooting (Sút xa)',
  'First Time Shot': 'First Time Shot (Dứt điểm một chạm)',
  'One-touch Shot': 'First Time Shot (Dứt điểm một chạm)',
  'Acrobatic Finishing': 'Acrobatic Finishing (Móc bóng / Vô-lê)',
  'Rising Shot': 'Rising Shot (Sút bóng căng/cắm)',
  'Dipping Shot': 'Dipping Shot (Sút bóng lá tre)',
  'Knuckle Shot': 'Knuckle Shot (Sút phạt Knuckleball)',
  'Acrobatic Clear': 'Acrobatic Clear (Cản phá vô-lê)',
  'Heading': 'Heading (Đánh đầu)',
  'Long Throw': 'Long Throw (Ném biên xa)',
  'Penalty Specialist': 'Penalty Specialist (Sút phạt đền)',
  'GK Low Punt': 'GK Low Punt (Phát bóng thấp)',
  'GK High Punt': 'GK High Punt (Phát bóng cao)',
  'GK Long Throw': 'GK Long Throw (Thủ môn ném bóng xa)',
  'Man Marking': 'Man Marking (Kèm người)',
  'Interception': 'Interception (Cắt bóng)',
  'Blocker': 'Blocker (Chặn bóng)',
  'Sliding Tackle': 'Sliding Tackle (Xoạc bóng)',
  'Captaincy': 'Captaincy (Thủ lĩnh)',
  'Super-sub': 'Super-sub (Siêu dự bị)',
  'Fighting Spirit': 'Fighting Spirit (Tinh thần chiến đấu)',
  'Tracks Back': 'Tracks Back (Tích cực lui về)',
  'Track Back': 'Tracks Back (Tích cực lui về)',
  'Low Punt': 'GK Low Punt (Phát bóng thấp)',
  'High Punt': 'GK High Punt (Phát bóng cao)',
  'Long Throw In': 'Long Throw (Ném biên xa)'
};

export const PLAYSTYLE_MAP: Record<string, string> = {
  'Goal Poacher': 'Goal Poacher (Kẻ săn bàn)',
  'Fox in the Box': 'Fox in the Box (Sát thủ vòng cấm)',
  'Deep-Lying Forward': 'Deep-Lying Forward (Tiền đạo lùi)',
  'Creative Playmaker': 'Creative Playmaker (Nhạc trưởng sáng tạo)',
  'Classic No. 10': 'Classic No. 10 (Số 10 cổ điển)',
  'Hole Player': 'Hole Player (Tiền vệ thọc sâu)',
  'Box to Box': 'Box-to-Box (Tiền vệ con thoi)',
  'Box-to-Box': 'Box-to-Box (Tiền vệ con thoi)',
  'The Destroyer': 'The Destroyer (Kẻ hủy diệt)',
  'Anchor Man': 'Anchor Man (Tiền vệ mỏ neo)',
  'Orchestrator': 'Orchestrator (Nhạc trưởng giữ nhịp)',
  'Build Up': 'Build Up (Triển khai bóng)',
  'Extra Frontman': 'Extra Frontman (Hậu vệ dâng cao)',
  'Offensive Full-back': 'Offensive Full-back (Hậu vệ cánh tấn công)',
  'Defensive Full-back': 'Defensive Full-back (Hậu vệ cánh phòng ngự)',
  'Full-back Finisher': 'Full-back Finisher (Hậu vệ cánh bó trong)',
  'Cross Specialist': 'Cross Specialist (Chuyên gia tạt bóng)',
  'Dummy Runner': 'Dummy Runner (Chim mồi)',
  'Target Man': 'Target Man (Tiền đạo mục tiêu)',
  'Prolific Winger': 'Prolific Winger (Tiền đạo cánh săn bàn)',
  'Roaming Flank': 'Roaming Flank (Tiền đạo cánh tự do)',
  'Offensive Goalkeeper': 'Offensive Goalkeeper (Thủ môn quét)',
  'Defensive Goalkeeper': 'Defensive Goalkeeper (Thủ môn phòng ngự)'
};

export const STAT_MAP: Record<string, string> = {
  'Attacking Prowess': 'Attacking Prowess (Nhận thức tấn công)',
  'Ball Control': 'Ball Control (Kiểm soát bóng)',
  'Dribbling': 'Dribbling (Rê bóng)',
  'Tight Possession': 'Tight Possession (Rê bóng hẹp)',
  'Finishing': 'Finishing (Dứt điểm)',
  'Low Pass': 'Low Pass (Chuyền sệt)',
  'Lofted Pass': 'Lofted Pass (Chuyền bổng)',
  'Speed': 'Speed (Tốc độ)',
  'Acceleration': 'Acceleration (Tăng tốc)',
  'Kicking Power': 'Kicking Power (Lực sút)',
  'Tackling': 'Tackling (Tắc bóng)',
  'Ball Winning': 'Ball Winning (Đoạt bóng)',
  'Interception': 'Interception (Đánh chặn)',
  'Defensive Awareness': 'Defensive Awareness (Nhận thức phòng ngự)',
  'Aggression': 'Aggression (Quyết liệt)',
  'Stamina': 'Stamina (Thể lực)',
  'Physical Contact': 'Physical Contact (Tranh chấp tì đè)',
  'Jump': 'Jump (Sức bật)',
  'Balance': 'Balance (Thăng bằng)',
  'Heading': 'Heading (Đánh đầu)',
  'Set Piece Taking': 'Set Piece Taking (Đá phạt cố định)',
  'Curl': 'Curl (Sút xoáy)',
  'GK Awareness': 'GK Awareness (Nhận thức thủ môn)',
  'GK Catching': 'GK Catching (Bắt bóng)',
  'GK Clearing': 'GK Clearing (Phá bóng)',
  'GK Reflexes': 'GK Reflexes (Phản xạ)',
  'GK Reach': 'GK Reach (Sải tay)'
};

export function translatePosition(pos: string): string {
  const clean = String(pos || '').trim().toUpperCase();
  return POSITION_MAP[clean] || pos;
}

export function translateSkill(skill: string): string {
  const clean = String(skill || '').trim();
  return SKILL_MAP[clean] || skill;
}

export function translatePlaystyle(style: string): string {
  const clean = String(style || '').trim();
  return PLAYSTYLE_MAP[clean] || style;
}

export function translateStat(stat: string): string {
  const clean = String(stat || '').trim();
  return STAT_MAP[clean] || stat;
}
