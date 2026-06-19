export interface RecentDocument {
  id: string
  status: string
  statusColor: string
  time: string
  title: string
  desc: string
  lawyerName: string
  lawyerAvatar: string
}

export interface FeaturedUpdate {
  title: string
  desc: string
  imageUrl: string
  actionText: string
}

export const RECENT_DOCUMENTS: RecentDocument[] = [
  {
    id: 'rec-1',
    status: 'Đang xử lý',
    statusColor: 'bg-info/100 text-info',
    time: 'Hôm nay',
    title: 'Hợp đồng lao động mẫu 2024',
    desc: 'Phân tích rủi ro pháp lý cho các điều khoản thôi việc và bảo mật thông tin.',
    lawyerName: 'Luật sư Trần Thu Hà',
    lawyerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnQ7-KrPAth6Ow9DtkRvu2qG3AimNOrxBn3ypiPu2kh37Rjct-RJNVmHwHAziVky-ttXwXntd3iFvTi4PVUJEH8HHViWBSxXtxvw1FFztUDA8ZCUv6RmMnlBsYDDeE50XsoyjhqgIKCfZLweHz9VTDtf6Ml637eaR3Pwc8SzARGDOtI1ucdtrtynz31G175i2oY6RIxEwZGIrqBOFXXiJ9f9uYAFoxR2ny8XOMhyQWcIp6b24YXMorPaEU7HFxDJaCKTVxJuXctGw'
  },
  {
    id: 'rec-2',
    status: 'Hoàn tất',
    statusColor: 'bg-success/100 text-success-primary',
    time: 'Hôm qua',
    title: 'Tranh chấp sở hữu trí tuệ',
    desc: 'Hồ sơ bằng chứng và các tài liệu liên quan đã được đóng gói.',
    lawyerName: 'Luật sư Lê Minh',
    lawyerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhbcnEP_TaNOdKRv4SeA45GIDCmd3ThkqWNahol9yrLy11W65lr1ArqdJTf_5xP5OJEhDsZXzydyf2ZrCROy5LcnmeKeIYHd6DObotShN0FhNia9nlkhRO13joN1v5a1OyJGSOaekd3sHMJU00517-PCQO1anq2xNOlLYPdcaSQvN9ZTgEVQtTivCBVJjn5Bsi0zj1k4xPFxj93qPWsFbzeN9lCDKcnI_Dd-7F0hetqYGWzMY7-_lZGWPZ85liwtIyJdfa3jhZzfY'
  }
]

export const FEATURED_UPDATE: FeaturedUpdate = {
  title: 'Cập nhật thư viện luật mới nhất',
  desc: 'Khám phá các thay đổi quan trọng trong luật dân sự áp dụng từ tháng 6 năm 2025.',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUn4iuso8M2M73aEYR7uh6g675F_cJoCYXyAAkh8evyTgyFupgvCNygZQS804DBmCaoIdIjFmnH1QXF0O0I4fRmNfaw1up6pDcD_cmZZF6G3bsF_jtv3HTKchwvVrNDAC8THhNoonzsakyhQZxsxAtZoHT8M9tCDPTeU_O7_0p1itH43OpXRDce9kw4bwdbbdyYcXli714f_4bsgzISpBqYL0ajs4yhRRwbo-lXlKAnUtn8TicUbA2tBd5JaHpNQgxtUX0Q2v2AS4',
  actionText: 'Tìm hiểu thêm'
}
