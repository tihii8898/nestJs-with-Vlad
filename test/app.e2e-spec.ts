import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3434);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3434');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'tihii@gmail.com',
      password: '123',
    };
    describe('Signup', () => {
      it('throw error with empty email', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('throw error with empty password', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('throw error with empty body provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should Signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED);
      });
    });
    describe('Login', () => {
      it('throw error with empty email', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('throw error with empty password', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('throw error with empty body provided', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should Login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(HttpStatus.ACCEPTED)
          .stores('userAccessToken', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('Get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken('$S{userAccessToken}')
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Edit User', () => {
      it('should get new user updated data', () => {
        const dto: EditUserDto = {
          firstName: 'Tihii',
          lastName: 'Nguyen',
        };
        return pactum
          .spec()
          .patch('/users/edit-me')
          .withBearerToken('$S{userAccessToken}')
          .withBody(dto)
          .expectBodyContains(dto.firstName)
          .withBody(dto)
          .expectBodyContains(dto.lastName)
          .expectStatus(HttpStatus.OK);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAccessToken}')
          .expectStatus(HttpStatus.OK)
          .expectBodyContains([]);
      });
    });
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'test create',
        description: '',
        link: 'abc.com',
      };
      it('should create new bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBody(dto)
          .withBearerToken('$S{userAccessToken}')
          .expectStatus(HttpStatus.CREATED)
          .stores('bmId', 'id');
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAccessToken}')
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmark with id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withBearerToken('$S{userAccessToken}')
          .withPathParams({
            id: '$S{bmId}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bmId}');
      });
    });
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'test edit bookmark',
      };
      it('should update bookmark with id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withBearerToken('$S{userAccessToken}')
          .withPathParams({
            id: '$S{bmId}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.title);
      });
      it('should throw forbidden exception', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withBearerToken('$S{userAccessToken}')
          .withPathParams({
            id: '$S{bmId}123',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete bookmark with id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withBearerToken('$S{userAccessToken}')
          .withPathParams({
            id: '$S{bmId}',
          })
          .expectStatus(HttpStatus.NO_CONTENT);
      });
      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{userAccessToken}')
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });
  });
});
