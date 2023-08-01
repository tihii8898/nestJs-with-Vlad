import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}
  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({ where: { userId } });
  }

  getBookmarkById(userId: number, bmId: number) {
    return this.prisma.bookmark.findFirst({
      where: {
        id: bmId,
        userId,
      },
    });
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const newBookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
    return newBookmark;
  }

  async editBookmarkById(userId: number, bmId: number, dto: EditBookmarkDto) {
    //todo: Get bookmark by Id
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bmId,
      },
    });

    // todo: check owner
    if (!bookmark || bookmark.userId !== userId) {
      throw new ForbiddenException('Access denied!');
    }

    return this.prisma.bookmark.update({
      where: {
        id: bmId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmarkById(userId: number, bmId: number) {
    //todo: Get bookmark by Id
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bmId,
      },
    });

    // todo: check owner
    if (!bookmark || bookmark.userId !== userId) {
      throw new ForbiddenException('Access denied!');
    }

    await this.prisma.bookmark.delete({
      where: {
        id: bmId,
      },
    });
  }
}
