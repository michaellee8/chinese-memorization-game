import { User, UserCredential, getAuth } from "firebase/auth"
import { useIdToken } from "react-firebase-hooks/auth"
import { CoreServicePromiseClient } from "@hkdse-practice/hkdse-practice-api-public/lib/dsepractice/chinese/v1alpha1/core_service_grpc_web_pb"
import {
  UnaryInterceptor,
  StreamInterceptor,
  Request,
  UnaryResponse,
  ClientReadableStream,
} from "grpc-web"

export function useCoreServiceClient() {
  const auth = getAuth()
  const [user] = useIdToken(auth)
  if (!user) {
    return new CoreServicePromiseClient(import.meta.env.VITE_API_URL)
  }
  return new CoreServicePromiseClient(import.meta.env.VITE_API_URL, null, {
    unaryInterceptors: [new AuthUnaryInterceptor(user)],
  })
}

class AuthUnaryInterceptor implements UnaryInterceptor<any, any> {
  constructor(private readonly user: User) {}
  async intercept(
    request: Request<any, any>,
    invoker: (request: Request<any, any>) => Promise<UnaryResponse<any, any>>,
  ): Promise<UnaryResponse<any, any>> {
    const token = await this.user.getIdToken()
    const metadata = request.getMetadata()
    metadata.Authorization = `Bearer ${token}`
    return await invoker(request)
  }
}
