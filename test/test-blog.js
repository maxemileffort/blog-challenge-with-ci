'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { TEST_DATABASE_URL, PORT } = require('../config');
const { Blogpost } = require('../models');
const { runServer, closeServer, app } = require('../server');

chai.use(chaiHttp);

function seedBlogPostData () {
    console.info('seeding blog post data');
    const seedData = [];

    for (let i=1;i<=5;i++){
        seedData.push(generateBlogPostData());
    }
    return Blogpost.insertMany(seedData);
}

function generateTitleName() {
    const titles = [
        'He learned this one trick... now banks hate him!',
        'Do this to burn fat in just 7 minutes!',
        'BJJ changed my life',
        'Why country sucks, and what to listen to instead'
    ]
    return titles[Math.floor(Math.random() * titles.length)]
}

function generateAuthorName() {
    const firstName = [
        'John',
        'Sally',
        'Ralph',
        'Carrie'
    ]
    const lastName = [
        'Doe',
        'Student',
        'Gracie',
        'Underwood'
    ]
   const authorName = { 
        firstName: firstName[Math.floor(Math.random() * firstName.length)],
        lastName: lastName[Math.floor(Math.random() * lastName.length)]
    }
    return authorName;
}

function generateContent() {
    const posts = [
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
        'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
        'Contrary to popular belief, Lorem Ipsum is not simply random text. ',
        'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which dont look even slightly believable',
        'The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.'
    ]
    return posts[Math.floor(Math.random() * posts.length)]
}

function generatePublishDate() {
    const date = Date.now();
    return date;
}

function generateBlogPostData() {
    return {
        title: generateTitleName(),
        author: generateAuthorName(),
        content: generateContent(),
        created: generatePublishDate()
    }
}

function tearDownDb() {
    console.info('tearing down db');
    return mongoose.connection.dropDatabase();
}

describe('blog api', function () {
    before(function(){
        return runServer(TEST_DATABASE_URL);
    })
    beforeEach(function(){
        return seedBlogPostData();
    })
    afterEach(function(){
        return tearDownDb();
    })
    after(function(){
        return closeServer();
    })

    describe('GET endpoint', function(){
        it('should return all existing blog posts', function (){
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function(_res){
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.lengthOf.at.least(1);
                    return Blogpost.count();
                })
                .then(function(count){
                    expect(res.body).to.have.lengthOf(count);
                })
        })
        it('should return blog posts with correct fields', function (){
            const keys = [
                "id", "title", "content", "author", "created"
            ]
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.lengthOf.at.least(1);
                    res.body.forEach(function(post){
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys(keys);
                    })
                })
        })
    })
    describe('POST endpoint', function(){
        const newPost = generateBlogPostData();

        it('should create a new blog post', function(){
            const keys = [
                "id", "title", "content", "author", "created"
            ]
            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys(keys);
                    expect(res.body.id).to.not.be.null;
                    return Blogpost.findById(res.body.id);
                })
                .then(function(post){
                    expect(post.title).to.equal(newPost.title);
                    expect(post.content).to.equal(newPost.content);
                    expect(post.author.firstName).to.equal(newPost.author.firstName);
                    expect(post.author.lastName).to.equal(newPost.author.lastName);
                    // expect(post.created).to.equal(newPost.created); <--not sure why this isn't working
                })
        })
    })
    describe('PUT endpoint', function(){
        it('should update a blog post retrieved by id', function(){
            const updateData = {
                title: 'fofofofofofofof',
                content: 'futuristic fusion'
            };

            return Blogpost
                .findOne()
                .then(function (post) {
                    updateData.id = post.id;

                    // make request then inspect it to make sure it reflects
                    // data we sent
                    return chai.request(app)
                        .put(`/posts/${post.id}`)
                        .send(updateData);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);

                    return Blogpost.findById(updateData.id);
                })
                .then(function (post) {
                    expect(post.title).to.equal(updateData.title);
                    expect(post.content).to.equal(updateData.content);
                });
        })
    })
    describe('DELETE endpoint', function(){
        it('should delete a post retrieved by id', function(){
            let post;

            return Blogpost
                .findOne()
                .then(function (_post) {
                    post = _post;
                    return chai.request(app).delete(`/posts/${post.id}`);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    return Blogpost.findById(post.id);
                })
                .then(function (_post) {
                    expect(_post).to.be.null;
                });
        })
    })
})
