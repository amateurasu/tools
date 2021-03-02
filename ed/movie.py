class Movie:
    def __init__(self, name, category, time):
        self._name = name
        self._category = category
        self._time = time

    @property    
    def name(self):
        return self._name
    
    @name.setter
    def name(self, value):
        self._name = value

    @property    
    def category(self):
        return self._category
    
    @category.setter
    def category(self, value):
        self._category = value
    
    @property    
    def score(self):
        return self._score
    
    @score.setter
    def score(self, value):
        self._score = value

    @property    
    def time(self):
        return self._time
    
    @time.setter
    def time(self, value):
        self._time = value

    def __str__(self):
        return f"name={self.name}, category={self.category}, time={self.time}"
    
    def print(self):
        print(str(self))


class MusicalMovie(Movie):
    def __init__(self, name, category, time, singer):
        super(MusicalMovie, self).__init__(name, category, time)
        self.__singer = singer

    @property    
    def singer(self):
        return self.__singer
    
    @singer.setter
    def singer(self, value):
        self.__singer = value

    def __str__(self):
        movie = super.__str__(self)
        return f"{movie}, singer={self.singer}"
    
    def print(self):
        print(str(self))


class FavouriteMoviesList():
    def __init__(self, owner):
        self.__favourite = []
        self.__owner = owner

    def add_movie(self, movie):
        self.__favourite.append(movie)

    def add_movies(self, **movies):
        for movie in movies:
            self.__favourite.append(movie)

    def show_list(self):
        for movie in self.favorite:
            print(movie)
    
    @property
    def average_score(self):
        return sum(m.score for m in self.favorite) / len(favorite)


def main():
    fav = FavouriteMoviesList("DucLM22")
    m1 = Movie("name 1", "Scifi", 1)
    m2 = MusicalMovie("name 2", "Comedy", 2, "AB")
    m3 = Movie("name 3", "Tragedy", 3)
    m4 = MusicalMovie("name 4", "Romance", 4, "CD")
    m5 = Movie("name 5", "Action", 5)
    m1.score = 1
    m2.score = 6
    m3.score = 7
    m4.score = 8
    m5.score = 9
    fav.add_movie(m1)
    fav.add_movies(m2, m3, m4, m5)
    print()

if __name__ == '__main__':
    main()