import bodyParser from "body-parser";
import express from "express";
import pg from "pg";


const app = express();
const port = 1500;

app.use(bodyParser.urlencoded({ extended: true }));
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "readbook",
    password: "Admin@123",
    port: 5432
});
db.connect();

app.get("/", async (req, res) => {
    try {
        var returnData = [];
       
        const result = await db.query("SELECT * FROM books JOIN reviews on books.id = reviews.id ORDER BY reviews.review", []);
        for (let i = 0; i < result.rows.length; i++) {
            var element = result.rows[i];
            const notes = await db.query("SELECT id,note FROM notes WHERE book_id = $1",[element.id]);
            element.notes = notes.rows;
            returnData.push(element);
        }
        console.log(returnData);
        res.json({
            type: "success",
            data: returnData,
            length: result.rows.length
        })
    } catch (error) {
        res.json({
            type: "error",
            message: "Cannot get data",
            error: error.message
        })
    }
});
app.post("/", async (req, res) => {
    const data = req.body;
    const title = data.title;
    const isbn = data.isbn;
    const date = new Date();
    const dateformat = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    const rating = data.rating;
    const review = data.review;
    const note = data.note;
    if (!title) {
        res.json({
            type: "error",
            message: "Title is null",
        })
    } else if (!isbn) {
        res.json({
            type: "error",
            message: "ISBN is null",
        })
    } else if (!rating) {
        res.json({
            type: "error",
            message: "Rating is null",
        })
    } else if (!review) {
        res.json({
            type: "error",
            message: "Review is null",
        })
    } else if (!note) {
        res.json({
            type: "error",
            message: "Note is null"
        })
    } else {
        const result = await db.query(`INSERT INTO books
                                    (title, isbn, date)
                                    VALUES ($1,$2,$3) RETURNING *`, [title, isbn, dateformat]);
        if (result) {
            let id = result.rows[0].id;
            console.log("id->" + id);
            await db.query(`INSERT INTO reviews(id, rating, review)
	                        VALUES ($1, $2, $3);`, [id, rating, review]);
            await db.query(`INSERT INTO notes(
	                        note, book_id)
	                        VALUES ($1, $2);`, [note, id]);
            res.json({
                type: "success",
                message: "Save success",
            });
        } else {
            res.json({
                type: "error",
                message: "Cannot insert data"
            })
        }
    }



})
app.put("/", async (req, res) => {
    
    const data = req.body;
    const id = data.id;
    const title = data.title;
    const isbn = data.isbn;
    const rating = data.rating;
    const review = data.review;
    const note = data.note;
    if (!id) {
        res.json({
            type: "error",
            message: "Id is null",
        })
    }else if (!title) { 
        res.json({
            type: "error",
            message: "Title is null",
        })
    } else if (!isbn) {
        res.json({
            type: "error",
            message: "ISBN is null",
        })
    } else if (!rating) {
        res.json({
            type: "error",
            message: "Rating is null",
        })
    } else if (!review) {
        res.json({
            type: "error",
            message: "Review is null",
        })
    } else if (!note) {
        res.json({
            type: "error",
            message: "Note is null"
        })
    }else{
        try {
            await db.query(`UPDATE books SET 
                title = $1 WHERE id=$2`,[title,id]);
            await db.query(`UPDATE notes SET note = $1 WHERE 
                book_id=$2`,[note,id]);
            await db.query(`UPDATE reviews SET
                 rating=$1, review=$2 WHERE id=$3`,[rating,review,id]);
            res.json({
                type: "success",
                message: "Updated success"
            });
        } catch (error) {
            res.json({
                type: "error",
                message: "Cannot update",
            })
        }
    }
  
});
app.post("/edit", async (req,res)=>{
    const id = req.body.id;

    console.log(req.body);
    var result = await db.query("SELECT * FROM books JOIN reviews ON books.id = reviews.id WHERE books.id = $1",[id]);
    if(result.rows.length>0){
        const notes = await db.query("SELECT id,note FROM notes WHERE book_id=$1",[id]);
        result.rows[0].notes = notes.rows;
        res.json({
            type: "success",
            message : "data",
            data: result.rows
        });
    }else{
        res.json({
            type: "success",
            message: "Nodata",
        })
    }   
})
app.delete("/", async (req, res) => {
    const id = req.body.id;
   try {
    await db.query("DELETE FROM books WHERE id=$1",[id]);
   await db.query("DELETE FROM notes WHERE book_id=$1",[id]);
   await db.query("DELETE FROM reviews WHERE id = $1",[id]);
   res.json({
    type: "success",
    message: "Deleted success"
})
   } catch (error) {
    res.json({
        type: "error",
        message: "Cannot Delete",
    })
   }
    
})
app.listen(port, () => {
    console.log(`port is listening on ${port}`);
});