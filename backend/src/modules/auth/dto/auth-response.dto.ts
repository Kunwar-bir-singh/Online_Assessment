export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    address: string;
  };
}
