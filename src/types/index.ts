
export interface MessageData {
  '№ стр.': number;
  'Дата': string; // format "DD.MM.YYYY"
  'Время': string; // format "HH:MM:SS"
  'Отправитель': string;
  'Тип события': 'предложение' | 'спрос' | 'приглашение' | 'событие';
  'Роль': string;
  'Технологии': string; // comma separated
  'Компания': string;
  'Формат': string;
  'Ставка (руб/ч)': number | string | null;
  'Срочность': 'regular' | 'urgent' | 'immediate';
  'Длительность (мес)': number | null;
  'Отрасль': string;
  'Контекст': string;
  'Связь (from → to)': string; // format "sender1 -> sender2"
  'Ниша / уникальная экспертиза': string;
  'Гео / локация': string;
}
