const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/cau-thu');
});

router.get('/cau-thu', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'stitch/c_s_d_li_u_c_u_th_efootball.vn_style/code.html'));
});

router.get('/cau-thu/:id', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'stitch/chi_ti_t_c_u_th_efootball.vn_style/code.html'));
});

router.get('/hlv', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'stitch/c_s_d_li_u_hlv_efootball.vn_style/code.html'));
});

router.get('/doi-hinh', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'stitch/x_y_d_ng_i_h_nh_efootball.vn_style/code.html'));
});

module.exports = router;
