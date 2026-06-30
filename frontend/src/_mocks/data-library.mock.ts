export interface LegalDocument {
  id: string;
  code: string;
  title: string;
  type: 'Luật' | 'Nghị quyết' | 'Nghị định';
  effect: 'Còn hiệu lực' | 'Hết hiệu lực';
}

export interface LawTopic {
  id: string;
  name: string;
  icon: string;
  documents: LegalDocument[];
}

export const MOCK_LAW_TOPICS: LawTopic[] = [
  {
    id: "civil",
    name: "Dân sự & Hợp đồng",
    icon: "Scale",
    documents: [
      { id: "doc-1", code: "Bộ luật số 91/2015/QH13", title: "Bộ luật Dân sự 2015", type: "Luật", effect: "Còn hiệu lực" },
      { id: "doc-2", code: "Nghị quyết 01/2019/NQ-HĐTP", title: "Hướng dẫn áp dụng quy định về lãi, lãi suất trong hợp đồng", type: "Nghị quyết", effect: "Còn hiệu lực" }
    ]
  },
  {
    id: "marriage",
    name: "Hôn nhân & Gia đình",
    icon: "Heart",
    documents: [
      { id: "doc-3", code: "Luật số 52/2014/QH13", title: "Luật Hôn nhân và Gia đình 2014", type: "Luật", effect: "Còn hiệu lực" },
      { id: "doc-4", code: "Nghị quyết 02/2000/NQ-HĐTP", title: "Hướng dẫn áp dụng một số quy định của Luật Hôn nhân và gia đình", type: "Nghị quyết", effect: "Còn hiệu lực" }
    ]
  },
  {
    id: "land",
    name: "Đất đai & Bất động sản",
    icon: "Home",
    documents: [
      { id: "doc-5", code: "Luật số 31/2024/QH15", title: "Luật Đất đai 2024 mới nhất", type: "Luật", effect: "Còn hiệu lực" },
      { id: "doc-6", code: "Nghị định 43/2014/NĐ-CP", title: "Quy định chi tiết thi hành một số điều của Luật Đất đai", type: "Nghị định", effect: "Còn hiệu lực" }
    ]
  }
];