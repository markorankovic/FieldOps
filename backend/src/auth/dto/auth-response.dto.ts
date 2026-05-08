import { UserSummaryDto } from '../../users/dto/user-summary.dto';

export type AuthResponseDto = {
  accessToken: string;
  user: UserSummaryDto;
};
