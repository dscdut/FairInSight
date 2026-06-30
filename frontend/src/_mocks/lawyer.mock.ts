import { LAW_MAJORS } from '@/core/constants/law-major'
import { type LawyerDetailResponse } from '@/models/lawyer/lawyer.type'
import { type Lawyer, type LawyerListResponse } from '@/models/lawyer/list-lawyer.type'

export const MOCK_LAWYERS: Lawyer[] = [
  {
    id: 'lyr-1',
    fullName: 'Nguyễn Hồng Sơn',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZoasD9OeVPWDsgwhpFX1Z-PCzw2qZRp5WsR3LZkxgLknU7iA_D6es3b6CYYFVqvVvKxP-onRlmhjiOVwuXj4vXtt0V2-OP7vWvRPwEf-NQoOcvLdJfOzWlmDG2Kku0lMSqR13bplYQFFqLJWv20ghuBA1ovvn4YAen81U61eAHWXDN-MctdYPeqEMwinX3UQ7HXnuKH1QamSI8GFU3E5WMXk2RBQvlS7TpvO1KbbAaCP2qZ2WnEzaSqPxgfjDvLS3XyMaiebkDS4',
    careerHistory: '15 năm kinh nghiệm',
    bio: 'Chuyên gia tư vấn luật doanh nghiệp, lao động và giải quyết các vụ việc tranh chấp thương mại phức tạp.',
    averageRating: 4.9,
    successfulCases: 120,
    specializations: ['Doanh nghiệp & Thương mại', 'Lao động'],
    city: 'Đà Nẵng'
  },
  {
    id: 'lyr-2',
    fullName: 'Lê Thị Quỳnh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEZRNLH32JO4b1gX0Rku7Pv_jpqg_KYUV7s9nTCFrN2p81hV5H3ZnP_G8I7tRZ-peCd3uNf-Xjj1vCNRYe_vsQWPzQntpQF7Avv-pKz67wlcU-JllpKaHSk_LWvKSGdNwu0PaoqrUoehMI8BhW48kKLXxWCcEilSTQoPeWD3tjEs35Ukk9EzJPH02Qo2IgGTUf78Ixl3FxN2uquAs72FTYfmXfv_29kxPXyJyR1FjD6ShOEyQIi3ajEDrdS0f5XcmF3rybq8wfx54',
    careerHistory: '10 năm kinh nghiệm',
    bio: 'Chuyên giải quyết các vụ tranh chấp dân sự, phân chia thừa kế, hợp đồng dân sự.',
    averageRating: 4.8,
    successfulCases: 95,
    specializations: ['Dân sự & Thừa kế'],
    city: 'Hà Nội'
  },
  {
    id: 'lyr-3',
    fullName: 'Trần Minh Hùng',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iwjYb6uqY7JqLdQYRGv_sAhUIl5dwUkOPx1HQ49ge2YYiRErNYLWMjFHXaeTH_bApV0G5Mu_TR-1hvczp9tQSwf_PorUfuHvdweX62CIJ-fVW9lRWg_Zn2Ub8rxWK7oPzL-S0Eb5viJKhYUuiHTEcXNA92QUm7XBh5OKCm58WFaPoUASIlueIvzzBownxAo5nlKJbMmUvFVAyA9k0X7YKFV5vm8i7oI-UsL2YGcVvo_UKoy6QXUKkTZyuob-zKYzKzCbYrW9zRM',
    careerHistory: '20 năm kinh nghiệm',
    bio: 'Bào chữa hình sự cao cấp, đại diện giải quyết các vụ án hành chính phức tạp.',
    averageRating: 5.0,
    successfulCases: 210,
    specializations: ['Hình sự', 'Hành chính'],
    city: 'TP. Hồ Chí Minh'
  },
  {
    id: 'lyr-4',
    fullName: 'Phạm Tuyết Mai',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3g38fU1EsV3sPPrbOkl9GOfSiZxWdNKluuuBRGomdbLwEQTwufXNsNWkVrngHeBrIodSdk4XhG_2FyCQgp_cWuPejIBuCAZn_A1S7T6CTW_ppgYxNK7Uw3Iwz5BGNpaDbBzWSwZgaaOiQjAd-SRg-oC5i9B10QmvCP1EsHOfz9iDaQMhZ60EM_AkfP7HnwvKjYJUh6wGl0dYlw6gxm3Q8ouHtM1O8Y0XzvLy_HOBp3W86OBx5mAb_a1UgRH08l-Chq-TOWW8ol2I',
    careerHistory: '8 năm kinh nghiệm',
    bio: 'Chuyên gia tư vấn sở hữu trí tuệ, đăng ký nhãn hiệu và tranh chấp bất động sản.',
    averageRating: 4.7,
    successfulCases: 65,
    specializations: ['Sở hữu trí tuệ', 'Đất đai & Bất động sản'],
    city: 'Cần Thơ'
  },
  {
    id: 'lyr-5',
    fullName: 'Đặng Quốc Anh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCscEvpy45tXydjZy1gjCNtKtsNWdZ3XOK7d_g6_kBKqwrUPQeLDUQrl6hST6d5zb19RjaRznZQj7P9PmaSNps3JUxHtxWK9L_5K3yUjKsNgtBl3CsNp-XwSIQnP_XmMrXgB4aym__ZJlLVtsTM-Mg0pAwSPns11DBq0yhAuF27NyVXyQPNgKl5Zl1Aepnc6OQkO5T-b9egYWn_LciGoI-2cT40L94e8G_h7z-bUznk4-aqF4ygP9ChVb9ZZ4CRC0Y-5yl3fzA7xM4',
    careerHistory: '12 năm kinh nghiệm',
    bio: 'Chuyên gia tư vấn thuế doanh nghiệp, thành lập doanh nghiệp và các giao dịch M&A.',
    averageRating: 4.9,
    successfulCases: 85,
    specializations: ['Doanh nghiệp & Thương mại'],
    city: 'Đà Nẵng'
  },
  {
    id: 'lyr-6',
    fullName: 'Hoàng Ngọc Diệp',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7yguXgoIRZlaRe1AY21AelzsKt-mrh1sy_wQ78ttBQQDOD5JPut1O1lMs-nfezC6EsJ9J93LAOu9hcvfXHg0DZvlQ5W68mRQqn2g6Fn_jx0tBGyWdDBKRDmqrtuA8wcZ_v0w_gWNTDGivhtXO-kPiV1xohNNaqktmjlJZs9f4oHnACgAu7vT5gXaItluH_JC96zOsCr0k8c8qZMVO1oXoCv-iCUUELaTbG-l8I7yZnVwXSUwxST95QHO-JL9-Rlqkjk3v9KtaKKk',
    careerHistory: '9 năm kinh nghiệm',
    bio: 'Tư vấn ly hôn, tranh chấp quyền nuôi con và phân chia tài sản chung vợ chồng.',
    averageRating: 4.6,
    successfulCases: 42,
    specializations: ['Hôn nhân & Gia đình', 'Dân sự & Thừa kế'],
    city: 'Hải Phòng'
  },
  {
    id: 'lyr-7',
    fullName: 'Võ Hoài Nam',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHoRuCytAqPr9092VpyKr1Mm0uCYx4pF6mnrH4bt2oiqKMVP5r2p2rSR4wRWvoF3MclOgXWB32bl2KG4FXxGBIXRM9tgS-ziY1gt0SiEjWTT8lKFzcUxN2z03T18C8BgKT0-kEPgA3_p-hk7jgWGjW75aNz_qXBYT50KxzUV7yR7uEP9yHRhhxpFbymWEigOhazNzDmj3WlSm8eBH2s4Hvqmntys-OxoGM1PL71ZbkiY7l0eTgOneOlibrQxvywwA0G1jOimYId9w',
    careerHistory: '11 năm kinh nghiệm',
    bio: 'Chuyên giải quyết tranh chấp lao động, nội quy lao động và thủ tục tố tụng hành chính.',
    averageRating: 4.8,
    successfulCases: 67,
    specializations: ['Lao động', 'Hành chính'],
    city: 'Quảng Nam'
  },
  {
    id: 'lyr-8',
    fullName: 'Nguyễn Văn Luật',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer1',
    careerHistory: '18 năm kinh nghiệm',
    bio: 'Chuyên giải quyết tranh chấp đất đai phức tạp, đền bù giải tỏa mặt bằng.',
    averageRating: 4.9,
    successfulCases: 180,
    specializations: ['Đất đai & Bất động sản'],
    city: 'Đà Nẵng'
  },
  {
    id: 'lyr-9',
    fullName: 'Lương Duy Toàn',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZoasD9OeVPWDsgwhpFX1Z-PCzw2qZRp5WsR3LZkxgLknU7iA_D6es3b6CYYFVqvVvKxP-onRlmhjiOVwuXj4vXtt0V2-OP7vWvRPwEf-NQoOcvLdJfOzWlmDG2Kku0lMSqR13bplYQFFqLJWv20ghuBA1ovvn4YAen81U61eAHWXDN-MctdYPeqEMwinX3UQ7HXnuKH1QamSI8GFU3E5WMXk2RBQvlS7TpvO1KbbAaCP2qZ2WnEzaSqPxgfjDvLS3XyMaiebkDS4',
    careerHistory: '14 năm kinh nghiệm',
    bio: 'Chuyên gia tranh tụng đất đai, thừa kế và dân sự.',
    averageRating: 4.8,
    successfulCases: 140,
    specializations: ['Đất đai & Bất động sản', 'Dân sự & Thừa kế'],
    city: 'Hà Nội'
  },
  {
    id: 'lyr-10',
    fullName: 'Nguyễn Thị Hồng Phúc',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEZRNLH32JO4b1gX0Rku7Pv_jpqg_KYUV7s9nTCFrN2p81hV5H3ZnP_G8I7tRZ-peCd3uNf-Xjj1vCNRYe_vsQWPzQntpQF7Avv-pKz67wlcU-JllpKaHSk_LWvKSGdNwu0PaoqrUoehMI8BhW48kKLXxWCcEilSTQoPeWD3tjEs35Ukk9EzJPH02Qo2IgGTUf78Ixl3FxN2uquAs72FTYfmXfv_29kxPXyJyR1FjD6ShOEyQIi3ajEDrdS0f5XcmF3rybq8wfx54',
    careerHistory: '16 năm kinh nghiệm',
    bio: 'Chuyên gia tư vấn pháp lý doanh nghiệp thường xuyên, đàm phán hợp đồng thương mại quốc tế.',
    averageRating: 4.9,
    successfulCases: 165,
    specializations: ['Doanh nghiệp & Thương mại'],
    city: 'TP. Hồ Chí Minh'
  },
  {
    id: 'lyr-11',
    fullName: 'Nguyễn Trung Ánh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iwjYb6uqY7JqLdQYRGv_sAhUIl5dwUkOPx1HQ49ge2YYiRErNYLWMjFHXaeTH_bApV0G5Mu_TR-1hvczp9tQSwf_PorUfuHvdweX62CIJ-fVW9lRWg_Zn2Ub8rxWK7oPzL-S0Eb5viJKhYUuiHTEcXNA92QUm7XBh5OKCm58WFaPoUASIlueIvzzBownxAo5nlKJbMmUvFVAyA9k0X7YKFV5vm8i7oI-UsL2YGcVvo_UKoy6QXUKkTZyuob-zKYzKzCbYrW9zRM',
    careerHistory: '7 năm kinh nghiệm',
    bio: 'Chuyên gia bảo hộ nhãn hiệu, bản quyền và tư vấn đăng ký sở hữu trí tuệ doanh nghiệp.',
    averageRating: 4.6,
    successfulCases: 50,
    specializations: ['Sở hữu trí tuệ'],
    city: 'Đà Nẵng'
  },
  {
    id: 'lyr-12',
    fullName: 'Hoàng Thị Ngọc Phương',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3g38fU1EsV3sPPrbOkl9GOfSiZxWdNKluuuBRGomdbLwEQTwufXNsNWkVrngHeBrIodSdk4XhG_2FyCQgp_cWuPejIBuCAZn_A1S7T6CTW_ppgYxNK7Uw3Iwz5BGNpaDbBzWSwZgaaOiQjAd-SRg-oC5i9B10QmvCP1EsHOfz9iDaQMhZ60EM_AkfP7HnwvKjYJUh6wGl0dYlw6gxm3Q8ouHtM1O8Y0XzvLy_HOBp3W86OBx5mAb_a1UgRH08l-Chq-TOWW8ol2I',
    careerHistory: '13 năm kinh nghiệm',
    bio: 'Cố vấn chuyên sâu về kết hôn có yếu tố nước ngoài, phân chia tài sản lớn sau ly hôn.',
    averageRating: 4.8,
    successfulCases: 135,
    specializations: ['Hôn nhân & Gia đình'],
    city: 'TP. Hồ Chí Minh'
  }
]

export const MOCK_LAWYERS_BY_CATEGORY: Record<string, Lawyer[]> = {
  [LAW_MAJORS.FAMILY_LONG]: MOCK_LAWYERS.filter(l => l.specializations.includes(LAW_MAJORS.FAMILY)),
  [LAW_MAJORS.LAND]: MOCK_LAWYERS.filter(l => l.specializations.includes(LAW_MAJORS.LAND_PROPERTY)),
  [LAW_MAJORS.CRIMINAL]: MOCK_LAWYERS.filter(l => l.specializations.includes(LAW_MAJORS.CRIMINAL)),
  [LAW_MAJORS.CIVIL]: MOCK_LAWYERS.filter(l => l.specializations.includes(LAW_MAJORS.CIVIL_INHERITANCE)),
  [LAW_MAJORS.LABOR]: MOCK_LAWYERS.filter(l => l.specializations.includes(LAW_MAJORS.LABOR)),
  [LAW_MAJORS.BUSINESS]: MOCK_LAWYERS.filter(l => l.specializations.includes(LAW_MAJORS.BUSINESS_COMMERCE)),
  [LAW_MAJORS.UNKNOWN]: MOCK_LAWYERS
}

export const getLawyerListMock = (
  page: number = 1,
  size: number = 8,
  filters?: {
    category?: string
    city?: string
    searchQuery?: string
    sortBy?: 'default' | 'rating' | 'cases'
  }
): LawyerListResponse => {
  let filtered = [...MOCK_LAWYERS]

  if (filters?.searchQuery?.trim()) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(
      (l) =>
        l.fullName.toLowerCase().includes(query) ||
        l.bio.toLowerCase().includes(query) ||
        l.specializations.some((s) => s.toLowerCase().includes(query))
    )
  }

  if (filters?.category && filters.category !== 'Tất cả') {
    const category = filters.category
    filtered = filtered.filter((l) => l.specializations.includes(category))
  }

  if (filters?.city && filters.city !== 'Tất cả') {
    filtered = filtered.filter((l) => l.city === filters.city)
  }

  if (filters?.sortBy === 'rating') {
    filtered.sort((a, b) => b.averageRating - a.averageRating)
  } else if (filters?.sortBy === 'cases') {
    filtered.sort((a, b) => b.successfulCases - a.successfulCases)
  }

  const total = filtered.length
  const totalPages = Math.ceil(total / size)
  const offset = (page - 1) * size
  const items = filtered.slice(offset, offset + size)

  return {
    data: {
      items,
      pagination: {
        page,
        size,
        total,
        totalPages
      }
    }
  }
}

export const getLawyerDetailMock = (id: string): LawyerDetailResponse => {
  const lawyer = MOCK_LAWYERS.find((l) => l.id === id) || MOCK_LAWYERS[0]
  
  const expMatch = lawyer.careerHistory.match(/\d+/)
  const experienceYears = expMatch ? parseInt(expMatch[0], 10) : 5

  return {
    data: {
      items: [],
      summary: {
        averageRating: lawyer.averageRating,
        careerHistory: lawyer.careerHistory,
        careerMilestones: [],
        consultingFee: 500000,
        experienceYears,
        licenseInfo: {
          isVerified: true,
          licenseFileUrl: null,
          licenseIssuer: 'Bộ Tư pháp',
          licenseNumber: `LS-${lawyer.id.replace('lyr-', '1000')}`
        },
        name: lawyer.fullName,
        role: 'Luật sư thành viên',
        specializations: lawyer.specializations
      }
    }
  }
}