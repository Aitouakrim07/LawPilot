import { GoogleCalendarConnector } from './GoogleCalendarConnector';
import { LocalConnector } from './LocalConnector';
import { NotionConnector } from './NotionConnector';

export const connectorRegistry = {
  local: new LocalConnector(),
  googleCalendar: new GoogleCalendarConnector(),
  notion: new NotionConnector(),
};

export const connectorCatalog = [
  {
    provider: 'local',
    label: 'LocalConnector',
    description: 'Full read/write support against the on-device SQLite database.',
  },
  {
    provider: 'google_calendar',
    label: 'GoogleCalendarConnector',
    description: 'Placeholder interface for future external calendar sync.',
  },
  {
    provider: 'notion',
    label: 'NotionConnector',
    description: 'Placeholder interface for future Notion workspace sync.',
  },
] as const;
